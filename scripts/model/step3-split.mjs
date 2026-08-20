/**
 * Step 3 — emit a GLB carrying the §13 semantic mesh names.
 *
 * Input:  one fused primitive with one baked material (Tripo output, reduced).
 * Output: one node per semantic part, named exactly as `Effect.targetMeshes`
 *         expects, so `asset.glbUrl` alone swaps the placeholder for the real
 *         vehicle with no code change (§12.4).
 *
 * Parts share one vertex buffer and differ only by index buffer, so splitting
 * costs no extra bytes — GLTFLoader caches the attribute accessors.
 *
 * Usage: node scripts/model/step3-split.mjs <reduced.glb> <out.glb> [--bike] [--debug]
 */
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from '@gltf-transform/extensions';
import { decodeTexture, sampleTex, bounds, connectedComponents, exteriorVisibility, sphereDirs, writePNG, renderLabelled } from './lib-mesh.mjs';

const args = process.argv.slice(2);
const [input, output] = args.filter((a) => !a.startsWith('--'));
const IS_BIKE = args.includes('--bike');
const DEBUG = args.includes('--debug');
// Debug renders go to .cache, never assets-src: that directory is licence-gated and holds
// source models only.
const debugDir = path.join('.cache', 'models', IS_BIKE ? 'debug-bike' : 'debug-sedan');
fs.mkdirSync(debugDir, { recursive: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();
const srcMesh = root.listMeshes()[0];
const srcPrim = srcMesh.listPrimitives()[0];
const srcMat = srcPrim.getMaterial();

const P = srcPrim.getAttribute('POSITION').getArray();
const N = srcPrim.getAttribute('NORMAL').getArray();
const UV = srcPrim.getAttribute('TEXCOORD_0').getArray();
const I = srcPrim.getIndices().getArray();
const nT = I.length / 3;
console.log('triangles', nT.toLocaleString(), IS_BIKE ? '(motorcycle)' : '(car)');

const bc = await decodeTexture(srcMat.getBaseColorTexture(), 2048);
const rm = await decodeTexture(srcMat.getMetallicRoughnessTexture(), 1024);
const B = bounds(P);
console.log('bounds', B.mn.map((v) => v.toFixed(3)).join(','), '->', B.mx.map((v) => v.toFixed(3)).join(','));

// ---------------------------------------------------------------------------
// per-triangle features
// ---------------------------------------------------------------------------
const F = {
  cx: new Float32Array(nT), cy: new Float32Array(nT), cz: new Float32Array(nT),
  lum: new Float32Array(nT), sat: new Float32Array(nT),
  rough: new Uint8Array(nT), metal: new Uint8Array(nT),
  red: new Float32Array(nT),
};
const SAMPLES = [[0.25, 0.25], [0.5, 0.25], [0.25, 0.5], [0.34, 0.33]];
for (let t = 0; t < nT; t++) {
  const a = I[t * 3], b = I[t * 3 + 1], c = I[t * 3 + 2];
  F.cx[t] = (P[a * 3] + P[b * 3] + P[c * 3]) / 3;
  F.cy[t] = (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3;
  F.cz[t] = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3;
  let sr = 0, sg = 0, sb = 0, sro = 0, sme = 0;
  for (const [w1, w2] of SAMPLES) {
    const w0 = 1 - w1 - w2;
    const u = w0 * UV[a * 2] + w1 * UV[b * 2] + w2 * UV[c * 2];
    const v = w0 * UV[a * 2 + 1] + w1 * UV[b * 2 + 1] + w2 * UV[c * 2 + 1];
    const s = sampleTex(bc, u, v);
    sr += s[0]; sg += s[1]; sb += s[2];
    if (rm) { const q = sampleTex(rm, u, v); sro += q[1]; sme += q[2]; }
  }
  const n = SAMPLES.length;
  const r = sr / n, g = sg / n, bl = sb / n;
  F.rough[t] = sro / n; F.metal[t] = sme / n;
  F.lum[t] = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  const mxc = Math.max(r, g, bl), mnc = Math.min(r, g, bl);
  F.sat[t] = mxc === 0 ? 0 : (mxc - mnc) / mxc;
  F.red[t] = r - (g + bl) / 2;
}

const { comp, count: nComp } = connectedComponents(P, I);
const compSize = new Int32Array(nComp);
for (let t = 0; t < nT; t++) compSize[comp[t]]++;
let mainComp = 0;
for (let i = 1; i < nComp; i++) if (compSize[i] > compSize[mainComp]) mainComp = i;
console.log('components', nComp, '| main holds', (compSize[mainComp] / nT * 100).toFixed(1) + '%');

console.log('exterior visibility pass...');
const vis = exteriorVisibility(P, I, sphereDirs(48), 640);

// per-component centroid, used to name the four wheel islands
const compCtr = Array.from({ length: nComp }, () => [0, 0, 0, 0]);
for (let t = 0; t < nT; t++) {
  const k = compCtr[comp[t]];
  k[0] += F.cx[t]; k[1] += F.cy[t]; k[2] += F.cz[t]; k[3]++;
}
compCtr.forEach((k) => { k[0] /= k[3]; k[1] /= k[3]; k[2] /= k[3]; });

// ---------------------------------------------------------------------------
// classification
// ---------------------------------------------------------------------------
// +Z is the front of the vehicle (verified against the preview renders).
const BADGE = { x: 0.052, y0: 0.122, y1: 0.174, z: 0.448 };
const labels = new Array(nT);

function classifyCar(t) {
  const cmp = comp[t];
  if (cmp !== mainComp) {
    // a wheel island: bright/metallic face is the alloy, the rest is rubber
    const front = compCtr[cmp][2] > 0;
    const right = compCtr[cmp][0] > 0;
    const isRim = F.metal[t] > 110 || F.lum[t] > 115;
    if (isRim) return `wheel_${front ? 'f' : 'r'}${right ? 'r' : 'l'}`;
    return front ? 'tyre_front' : 'tyre_rear';
  }
  if (Math.abs(F.cx[t]) < BADGE.x && F.cy[t] > BADGE.y0 && F.cy[t] < BADGE.y1 && F.cz[t] > BADGE.z) return 'badge_front';
  if (!vis[t]) return F.cz[t] > 0.06 ? 'interior_dash' : 'interior_seats';
  if (F.red[t] > 28 && F.sat[t] > 0.28) return 'taillight_lens';
  /*
   * Only body_paint and badge_front get a synthetic material — every other part
   * keeps the baked atlas, so a mistake between trim/chrome/lens is invisible.
   * The one thing that MUST be exact is body_paint, because those triangles are
   * what a paint option recolours: let a headlight lens leak in and picking
   * "Racing Blue" paints the headlight blue.
   *
   * The bake puts painted panels at ~230 luminance and leaves lenses, chrome and
   * rubber well below, so a high luminance cut plus a metalness veto separates
   * them without needing to identify each part individually.
   */
  const painted = F.lum[t] > 190 && F.metal[t] < 105 && F.sat[t] < 0.20;
  if (painted) return 'body_paint';
  if (F.metal[t] > 135 && F.lum[t] > 110) return 'chrome_trim';
  if (F.cz[t] > 0.40 && F.rough[t] < 40 && F.lum[t] > 130) return 'headlight_lens';
  return 'trim_dark';
}

function classifyBike(t) {
  // The bike is a single fused island, so connectivity gives nothing; colour,
  // roughness and position carry the whole classification.
  if (!vis[t]) return 'trim_dark';
  if (F.red[t] > 28 && F.sat[t] > 0.28) return 'taillight_lens';
  if (F.rough[t] < 45 && F.lum[t] > 120 && F.cz[t] > 0.25) return 'headlight_lens';
  if (F.metal[t] > 135 && F.lum[t] > 105) return 'chrome_trim';
  // saturated blue paint is the tank/panel colour on this model
  if (F.sat[t] > 0.30) return 'body_paint';
  if (F.lum[t] > 150) return 'chrome_trim';
  return 'trim_dark';
}

const classify = IS_BIKE ? classifyBike : classifyCar;
for (let t = 0; t < nT; t++) labels[t] = classify(t);

const counts = new Map();
for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
console.log('\nparts:');
[...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${k.padEnd(18)} ${String(v).padStart(7)}  ${(v / nT * 100).toFixed(2)}%`));

// ---------------------------------------------------------------------------
// badge removal — flatten the emblem into the grille instead of deleting it,
// which would punch a hole through to the bumper interior
// ---------------------------------------------------------------------------
if (!IS_BIKE) {
  const Pw = srcPrim.getAttribute('POSITION').getArray();
  const badgeVerts = new Set();
  for (let t = 0; t < nT; t++)
    if (labels[t] === 'badge_front') for (let c = 0; c < 3; c++) badgeVerts.add(I[t * 3 + c]);
  // grille reference plane = the z the surrounding panel sits at
  let zsum = 0, zn = 0;
  for (let t = 0; t < nT; t++) {
    if (labels[t] === 'badge_front') continue;
    if (Math.abs(F.cx[t]) < 0.10 && F.cy[t] > BADGE.y0 - 0.012 && F.cy[t] < BADGE.y1 + 0.012 && F.cz[t] > 0.44) { zsum += F.cz[t]; zn++; }
  }
  const zPlane = zn ? zsum / zn : 0.470;
  /*
   * Pin EVERY badge vertex to the plane, not only those standing proud of it. Flattening
   * just the protruding face left the emblem's rim — the vertices running back from the
   * badge face to the grille — in place, and that outline stayed perfectly legible.
   */
  let moved = 0;
  for (const v of badgeVerts) {
    if (Pw[v * 3 + 2] !== zPlane) moved++;
    Pw[v * 3 + 2] = zPlane;
  }
  srcPrim.getAttribute('POSITION').setArray(Pw);

  /*
   * Flatten the NORMALS too, and this is the part that actually erases the mark.
   *
   * Shading reads normals, not positions. Collapsing the vertices onto one plane left every
   * normal still pointing the way the emblem's original surface faced, so the logo carried
   * on catching the key light in full relief across geometry that was measurably flat —
   * gone by the numbers and plainly visible on screen. Source space has +Z forward, so
   * pointing the whole patch straight out of the grille is what removes it.
   */
  const Nw = srcPrim.getAttribute('NORMAL').getArray();
  for (const v of badgeVerts) {
    Nw[v * 3] = 0;
    Nw[v * 3 + 1] = 0;
    Nw[v * 3 + 2] = 1;
  }
  srcPrim.getAttribute('NORMAL').setArray(Nw);

  console.log(`\nbadge: flattened ${moved} of ${badgeVerts.size} vertices (position + normal) onto grille plane z=${zPlane.toFixed(4)}`);
}

if (DEBUG) {
  const palette = {
    body_paint: [235, 235, 238], trim_dark: [60, 62, 68], chrome_trim: [255, 210, 90],
    headlight_lens: [120, 220, 255], taillight_lens: [255, 60, 60],
    interior_seats: [255, 130, 200], interior_dash: [190, 90, 220],
    tyre_front: [30, 30, 34], tyre_rear: [50, 50, 56],
    wheel_fl: [90, 255, 140], wheel_fr: [60, 210, 255], wheel_rl: [255, 160, 60], wheel_rr: [180, 120, 255],
    badge_front: [255, 0, 255],
  };
  const col = (t) => palette[labels[t]] ?? [255, 255, 0];
  for (const v of [
    { az: Math.PI * 0.3, el: 0.2, tag: 'front34' },
    { az: Math.PI * 1.3, el: 0.2, tag: 'rear34' },
    { az: Math.PI * 0.5, el: 0.08, tag: 'side' },
    { az: 0, el: 0.05, tag: 'front' },
  ]) {
    const { img, W, H } = renderLabelled(P, N, I, col, v);
    writePNG(path.join(debugDir, `parts-${v.tag}.png`), W, H, img);
  }
  console.log('label renders ->', debugDir);
}

// ---------------------------------------------------------------------------
// emit one node per part
// ---------------------------------------------------------------------------
const clearcoatExt = doc.createExtension(KHRMaterialsClearcoat);

const paintMat = doc.createMaterial('body_paint')
  .setBaseColorFactor([0.88, 0.89, 0.89, 1])
  .setMetallicFactor(0.16)
  .setRoughnessFactor(0.3)
  .setNormalTexture(srcMat.getNormalTexture());
paintMat.setExtension('KHR_materials_clearcoat', clearcoatExt.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.06));

// A flat dark plate: the emblem relief is gone, and dropping the baked atlas
// takes the printed logo with it.
const badgeMat = doc.createMaterial('badge_plate')
  .setBaseColorFactor([0.07, 0.075, 0.08, 1])
  .setMetallicFactor(0.2)
  .setRoughnessFactor(0.55);

const materialFor = (name) => {
  if (name === 'body_paint') return paintMat;
  if (name === 'badge_front') return badgeMat;
  return srcMat;
};

const scene = root.listScenes()[0];
for (const node of root.listNodes()) node.dispose();

const posAcc = srcPrim.getAttribute('POSITION');
const nrmAcc = srcPrim.getAttribute('NORMAL');
const uvAcc = srcPrim.getAttribute('TEXCOORD_0');
const buffer = root.listBuffers()[0];

const order = [...counts.keys()].sort();
for (const name of order) {
  const tris = [];
  for (let t = 0; t < nT; t++) if (labels[t] === name) tris.push(t);
  if (!tris.length) continue;
  const idx = new Uint32Array(tris.length * 3);
  for (let i = 0; i < tris.length; i++) {
    idx[i * 3] = I[tris[i] * 3];
    idx[i * 3 + 1] = I[tris[i] * 3 + 1];
    idx[i * 3 + 2] = I[tris[i] * 3 + 2];
  }
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setAttribute('NORMAL', nrmAcc)
    .setAttribute('TEXCOORD_0', uvAcc)
    .setIndices(doc.createAccessor(name + '_idx').setArray(idx).setType('SCALAR').setBuffer(buffer))
    .setMaterial(materialFor(name));
  // name BOTH mesh and node: GLTFLoader assigns the node name to the resulting
  // THREE.Mesh, and the effect engine matches on mesh.name exactly.
  const mesh = doc.createMesh(name).addPrimitive(prim);
  scene.addChild(doc.createNode(name).setMesh(mesh));
}
srcMesh.dispose();

await io.write(output, doc);
const { size } = await fs.promises.stat(output);
console.log(`\nwrote ${output} ${(size / 1048576).toFixed(2)} MB, ${order.length} named parts`);
