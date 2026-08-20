/**
 * prepare-vehicle.mjs — turn a PART-SEPARATED source GLB into a shippable vehicle.
 *
 * This replaces the step1..step5 salvage pipeline, which existed only because the first pair
 * of models arrived as one fused mesh with one baked atlas. Those had to be decimated 16x and
 * re-split by inference, and the decimation is what made them look crushed.
 *
 * These models arrive already separated (56 parts on the sedan, 103 on the bike) and already
 * inside the §13 triangle budget, so the correct amount of geometry processing is NONE. The
 * high LOD ships the source triangles untouched. Everything here is naming, de-branding,
 * placement and compression.
 *
 *   node scripts/model/prepare-vehicle.mjs <source.glb> <slug> --yaw 90 --length 4.626 [--bike] [--verify]
 *
 * --verify writes isolation renders instead of publishing, so body_paint can be checked
 * before a client ever sees it.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from '@gltf-transform/extensions';
import { meshopt, simplify, dedup, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const [input, slug] = positional;
if (!input || !slug) {
  console.error('usage: prepare-vehicle.mjs <source.glb> <slug> [--yaw deg] [--length m] [--bike] [--verify]');
  process.exit(1);
}
const YAW = (Number(flag('yaw', '0')) * Math.PI) / 180;
const TARGET_LEN = Number(flag('length', '0'));
const IS_BIKE = argv.includes('--bike');
const VERIFY = argv.includes('--verify');

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const doc = await io.read(input);
const root = doc.getRoot();

// ---------------------------------------------------------------------------
// 1. flatten the node tree into parts, in world space
// ---------------------------------------------------------------------------
const mul = (a, b) => {
  const o = new Float64Array(16);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
};
const IDENT = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const xformP = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const xformN = (m, x, y, z) => {
  const o = [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];
  const l = Math.hypot(...o) || 1;
  return [o[0] / l, o[1] / l, o[2] / l];
};

const parts = [];
function collect(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) for (const prim of mesh.listPrimitives()) parts.push({ index: parts.length, node, mesh, prim, world });
  for (const c of node.listChildren()) collect(c, world);
}
for (const scene of root.listScenes()) for (const n of scene.listChildren()) collect(n, IDENT);
console.log(`${parts.length} source parts`);

// Bake the world transform into the vertices so the whole model becomes one flat list of
// nodes at the origin — the effect engine looks up meshes by name and never walks parents.
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  const posAcc = p.prim.getAttribute('POSITION');
  const nrmAcc = p.prim.getAttribute('NORMAL');
  const pos = posAcc.getArray().slice();
  for (let i = 0; i < pos.length; i += 3) {
    const w = xformP(p.world, pos[i], pos[i + 1], pos[i + 2]);
    pos[i] = w[0]; pos[i + 1] = w[1]; pos[i + 2] = w[2];
    for (let k = 0; k < 3; k++) { if (w[k] < mn[k]) mn[k] = w[k]; if (w[k] > mx[k]) mx[k] = w[k]; }
  }
  posAcc.setArray(pos);
  if (nrmAcc) {
    const nrm = nrmAcc.getArray().slice();
    for (let i = 0; i < nrm.length; i += 3) {
      const w = xformN(p.world, nrm[i], nrm[i + 1], nrm[i + 2]);
      nrm[i] = w[0]; nrm[i + 1] = w[1]; nrm[i + 2] = w[2];
    }
    nrmAcc.setArray(nrm);
  }
  p.pos = pos;
  p.idx = p.prim.getIndices()?.getArray() ?? null;
  p.tris = p.idx ? p.idx.length / 3 : pos.length / 9;
}
const size = mx.map((v, i) => v - mn[i]);
console.log('source bounds', size.map((v) => v.toFixed(3)).join(' x '));

// per-part bbox in the baked frame
for (const p of parts) {
  const bmn = [Infinity, Infinity, Infinity], bmx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (p.pos[i + k] < bmn[k]) bmn[k] = p.pos[i + k];
      if (p.pos[i + k] > bmx[k]) bmx[k] = p.pos[i + k];
    }
  p.mn = bmn; p.mx = bmx;
  p.size = bmx.map((v, i) => v - bmn[i]);
  p.ctr = bmn.map((v, i) => (v + bmx[i]) / 2);
}

// ---------------------------------------------------------------------------
// 2. per-part average colour, sampled at real UVs
// ---------------------------------------------------------------------------
const texCache = new Map();
async function decodeTex(tex) {
  if (!tex) return null;
  if (texCache.has(tex)) return texCache.get(tex);
  const { data, info } = await sharp(Buffer.from(tex.getImage()))
    .resize(128, 128, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { w: info.width, h: info.height, ch: info.channels, data };
  texCache.set(tex, img);
  return img;
}
for (const p of parts) {
  const mat = p.prim.getMaterial();
  const img = await decodeTex(mat?.getBaseColorTexture());
  const uv = p.prim.getAttribute('TEXCOORD_0')?.getArray();
  let r = 128, g = 128, b = 128;
  if (img && uv) {
    let sr = 0, sg = 0, sb = 0, n = 0;
    const step = Math.max(1, Math.floor(p.tris / 1500));
    for (let t = 0; t < p.tris; t += step) {
      const a = p.idx ? p.idx[t * 3] : t * 3;
      const c1 = p.idx ? p.idx[t * 3 + 1] : t * 3 + 1;
      const c2 = p.idx ? p.idx[t * 3 + 2] : t * 3 + 2;
      const u = (uv[a * 2] + uv[c1 * 2] + uv[c2 * 2]) / 3;
      const v = (uv[a * 2 + 1] + uv[c1 * 2 + 1] + uv[c2 * 2 + 1]) / 3;
      let x = Math.floor((((u % 1) + 1) % 1) * img.w);
      let y = Math.floor((((v % 1) + 1) % 1) * img.h);
      if (x < 0) x = 0; else if (x >= img.w) x = img.w - 1;
      if (y < 0) y = 0; else if (y >= img.h) y = img.h - 1;
      const o = (y * img.w + x) * img.ch;
      sr += img.data[o]; sg += img.data[o + 1]; sb += img.data[o + 2];
      n++;
    }
    if (n) { r = sr / n; g = sg / n; b = sb / n; }
  }
  p.rgb = [r, g, b];
  p.lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mc = Math.max(r, g, b), nc = Math.min(r, g, b);
  p.sat = mc === 0 ? 0 : (mc - nc) / mc;
  p.blueBias = b - r;
}

// ---------------------------------------------------------------------------
// 2b. per-part exterior visibility
// ---------------------------------------------------------------------------
/*
 * Rasterise part ids from viewpoints on a sphere and count how much of each part is ever the
 * front-most surface. Colour and position alone cannot tell an outer door skin from the
 * inner floor pan — both are large, both sit mid-height, and on this model both sample a
 * similar grey. Visibility separates them cleanly, and it is what stops a paint option from
 * recolouring the underbody.
 */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

function exteriorPixels(res = 384, dirCount = 32) {
  const seen = new Float64Array(parts.length);
  const centre = mn.map((v, i) => v + size[i] / 2);
  const radius = Math.hypot(...size) / 2;
  const zbuf = new Float32Array(res * res);
  const idbuf = new Int32Array(res * res);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let d = 0; d < dirCount; d++) {
    const yy = 1 - (d / (dirCount - 1)) * 1.35; // bias to the upper hemisphere: nobody views a car from below
    const r = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = phi * d;
    const dir = [Math.cos(th) * r, Math.max(-0.15, yy), Math.sin(th) * r];
    const dl = Math.hypot(...dir);
    const eye = [centre[0] + (dir[0] / dl) * radius * 3, centre[1] + (dir[1] / dl) * radius * 3, centre[2] + (dir[2] / dl) * radius * 3];
    const fwd = norm(sub(centre, eye));
    const upRef = Math.abs(fwd[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
    const right = norm(cross(fwd, upRef));
    const up = cross(right, fwd);
    const sc = res / (radius * 2.1);
    zbuf.fill(Infinity);
    idbuf.fill(-1);
    for (const p of parts) {
      const P = p.pos, idx = p.idx;
      const nT = idx ? idx.length / 3 : P.length / 9;
      const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];
      for (let t = 0; t < nT; t++) {
        const vi = [0, 1, 2].map((c) => (idx ? idx[t * 3 + c] : t * 3 + c) * 3);
        for (let k = 0; k < 3; k++) {
          const q = [P[vi[k]] - eye[0], P[vi[k] + 1] - eye[1], P[vi[k] + 2] - eye[2]];
          sx[k] = dot(q, right) * sc + res / 2;
          sy[k] = res / 2 - dot(q, up) * sc;
          sz[k] = dot(q, fwd);
        }
        const minx = Math.max(0, Math.floor(Math.min(...sx))), maxx = Math.min(res - 1, Math.ceil(Math.max(...sx)));
        const miny = Math.max(0, Math.floor(Math.min(...sy))), maxy = Math.min(res - 1, Math.ceil(Math.max(...sy)));
        if (minx > maxx || miny > maxy) continue;
        const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
        if (Math.abs(area) < 1e-12) continue;
        for (let y = miny; y <= maxy; y++)
          for (let x = minx; x <= maxx; x++) {
            const px = x + 0.5, py = y + 0.5;
            const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
            const w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2];
            const o = y * res + x;
            if (z < zbuf[o]) { zbuf[o] = z; idbuf[o] = p.index; }
          }
      }
    }
    for (let i = 0; i < idbuf.length; i++) if (idbuf[i] >= 0) seen[idbuf[i]]++;
  }
  return seen;
}

console.log('exterior visibility pass...');
const seenPx = exteriorPixels();
const maxSeen = Math.max(...seenPx, 1);
for (const p of parts) {
  p.seen = seenPx[p.index];
  // normalised against the part's own screen footprint, so a small mirror is not penalised
  // for being small — what matters is whether it is ever on the outside at all
  p.exterior = p.seen > maxSeen * 0.004;
}

// ---------------------------------------------------------------------------
// 3. classify parts into §13 semantic names
// ---------------------------------------------------------------------------
// Source frame: longest axis is length. Recorded before any yaw is applied.
const lengthAxis = size.indexOf(Math.max(...size));
const upAxis = 1;
const widthAxis = [0, 1, 2].find((a) => a !== lengthAxis && a !== upAxis);
const L = (p) => p.ctr[lengthAxis];
const Wd = (p) => p.ctr[widthAxis];
const Hy = (p) => p.ctr[upAxis];
const halfLen = size[lengthAxis] / 2;
const height = size[upAxis];

/*
 * The body colour on these models is a desaturated BLUE-BIASED grey: painted panels sample
 * around sat 0.14–0.22 with blue roughly 15–25 above red, while tyres, rims, interior trim
 * and the underbody all sample neutral (sat < 0.10, blue ≈ red). Lenses are excluded first —
 * a taillight is strongly saturated but red-biased, a headlight is bright and neutral.
 *
 * Only body_paint has to be exact, because those are the meshes a paint option recolours.
 * Everything else keeps its own baked material, so a mistake between trim and chrome is
 * invisible on screen.
 */
function classify(p) {
  const rel = (L(p) + halfLen) / (halfLen * 2); // 0 = rear, 1 = front
  const yFrac = (Hy(p) - mn[upAxis]) / height;

  /*
   * The bike is painted RED, not blue-biased grey, so it needs its own colour test — and the
   * order has to flip. On the car the red test means "taillight"; on the bike it means "tank,
   * tail panel or mudguard", and the taillight is the exception rather than the rule. It is
   * separated by being small AND at the extreme rear.
   */
  if (IS_BIKE) {
    const red = p.sat > 0.28 && p.rgb[0] > p.rgb[2] + 18;
    if (red && rel < 0.14 && p.tris < 1500) return 'taillight_lens';
    if (red) return 'body_paint';
    if (p.lum > 135 && p.sat < 0.12 && rel > 0.78) return 'headlight_lens';
    if (!p.exterior) return 'trim_dark';
    if (p.lum > 125 && p.sat < 0.10) return 'chrome_trim';
    return 'trim_dark';
  }

  // lenses first — a taillight is strongly red, a headlight is bright and neutral up front
  if (p.sat > 0.35 && p.rgb[0] > p.rgb[2] + 20) return 'taillight_lens';
  if (p.lum > 130 && p.sat < 0.10 && rel > 0.72) return 'headlight_lens';

  /*
   * PAINT FIRST, and on blue bias alone.
   *
   * The body colour on these models is a desaturated BLUE-BIASED grey. Measured across the
   * sedan's 56 parts the separation is total and there is a clean empty gap at ~4: painted
   * panels sit at blue +6 to +28, while tyres, rims, glass, interior and the underbody all
   * sit between -3 and +3. Nothing else on the car is blue-biased, so this one test is
   * stronger than any combination of position rules — and position rules are exactly what
   * mislabelled both front wings as wheels on the previous attempt.
   *
   * This has to run before the wheel test for the same reason: a front wing is compact, low
   * and far off the centreline, which is indistinguishable from a wheel geometrically.
   */
  const painted = p.exterior && p.blueBias >= 4.5 && p.lum > 28;
  if (painted) return 'body_paint';

  // Wheels: compact, low, well off the centreline, and NEUTRAL — the paint test above has
  // already taken every panel that shares those coordinates.
  const compact = Math.max(...p.size) < size[lengthAxis] * 0.20;
  if (!IS_BIKE && compact && yFrac < 0.52 && Math.abs(Wd(p)) > size[widthAxis] * 0.22) {
    const front = L(p) > 0;
    const right = Wd(p) > 0;
    if (p.lum < 34) return front ? 'tyre_front' : 'tyre_rear';
    return `wheel_${front ? 'f' : 'r'}${right ? 'r' : 'l'}`;
  }

  if (p.lum > 120 && p.sat < 0.10) return 'chrome_trim';

  /*
   * Seats: compact, inboard, at cabin height. They are visible from outside through the
   * glass, so exterior visibility cannot be used to find them — the cabin shell and the
   * glass are both large and neutral, and only the seats are also compact and inboard.
   */
  const seatSized = Math.max(...p.size) < size[lengthAxis] * 0.25;
  if (seatSized && yFrac > 0.35 && yFrac < 0.80 && Math.abs(Wd(p)) < size[widthAxis] * 0.30 && p.lum < 75) {
    return 'interior_seats';
  }

  return 'trim_dark';
}

for (const p of parts) p.label = classify(p);

// The grille bar carries a modelled manufacturer emblem and the plate carries invented text;
// both are found by position, then de-branded in step 4 rather than deleted, because deleting
// leaves a hole straight through to the bumper interior.
if (!IS_BIKE) {
  const frontish = parts.filter((p) => L(p) > halfLen * 0.85);
  const byArea = (p) => p.size[widthAxis] * p.size[upAxis];
  const grille = frontish
    .filter((p) => Math.abs(Wd(p)) < 0.02 * size[widthAxis] + 0.01 && p.size[widthAxis] > size[widthAxis] * 0.35)
    .sort((a, b) => Hy(b) - Hy(a))[0];
  if (grille) grille.label = 'badge_front';
  const plate = frontish
    .filter((p) => p !== grille && p.size[widthAxis] > size[widthAxis] * 0.15 && p.size[widthAxis] < size[widthAxis] * 0.35 && byArea(p) > 0)
    .sort((a, b) => byArea(b) - byArea(a))[0];
  if (plate) plate.label = 'plate_front';
}

if (VERIFY) {
  console.log('\nper-part features (sorted by triangles):');
  console.log('  idx    tris  ext   seen   lum   sat  blue   size(x,y,z)               centre(x,y,z)          label');
  parts.slice().sort((a, b) => b.tris - a.tris).forEach((p) => {
    console.log(
      String(p.index).padStart(5),
      String(p.tris).padStart(7),
      (p.exterior ? ' Y ' : ' . ').padStart(4),
      String(Math.round(p.seen)).padStart(6),
      String(Math.round(p.lum)).padStart(5),
      p.sat.toFixed(2).padStart(5),
      String(Math.round(p.blueBias)).padStart(5),
      '  ' + p.size.map((v) => v.toFixed(3).padStart(6)).join(','),
      '  ' + p.ctr.map((v) => v.toFixed(3).padStart(6)).join(','),
      '  ' + p.label,
    );
  });
}

const tally = new Map();
for (const p of parts) tally.set(p.label, (tally.get(p.label) ?? 0) + p.tris);
console.log('\nparts by label:');
[...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  const n = parts.filter((p) => p.label === k).length;
  console.log(`  ${k.padEnd(16)} ${String(n).padStart(3)} parts  ${String(v).padStart(7)} tris`);
});

// ---------------------------------------------------------------------------
// 4. de-brand: repaint the emblem and the plate out of their own textures
// ---------------------------------------------------------------------------
/**
 * Radial inpaint: every pixel inside the disc is replaced by the nearest pixel outside it
 * along the same radius, which continues the surrounding gradient rather than stamping a
 * flat patch. The grille around the emblem is smooth dark plastic, so the result reads as a
 * clean debadged grille.
 */
function inpaintRect(data, w, h, ch, x0, y0, x1, y1) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(w - 1, Math.ceil(x1)); y1 = Math.min(h - 1, Math.ceil(y1));
  if (x1 <= x0 || y1 <= y0) return;
  const src = Buffer.from(data);
  const px = (x, y, c) => src[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * ch + c];
  const spanX = x1 - x0, spanY = y1 - y0;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const tx = spanX ? (x - x0) / spanX : 0;
      const ty = spanY ? (y - y0) / spanY : 0;
      const to = (y * w + x) * ch;
      for (let c = 0; c < ch; c++) {
        // Bilinear blend of the four edge pixels just outside the patch, which continues the
        // surrounding gradient instead of stamping a flat rectangle onto it.
        const left = px(x0 - 2, y, c), rightP = px(x1 + 2, y, c);
        const top = px(x, y0 - 2, c), bottom = px(x, y1 + 2, c);
        const hMix = left * (1 - tx) + rightP * tx;
        const vMix = top * (1 - ty) + bottom * ty;
        data[to + c] = Math.round(hMix * 0.5 + vMix * 0.5);
      }
    }
}

/**
 * Repaint a mark out of one part's own texture.
 *
 * `select` picks the vertices carrying the mark in model space; their UVs give the exact
 * rectangle of the image to erase. Inpainting the whole part's UV centre instead — which is
 * what the first attempt did — misses, because a part's chart centre is not where its badge
 * sits.
 */
async function debrand(part, kind, select) {
  const mat = part.prim.getMaterial();
  const tex = mat?.getBaseColorTexture();
  if (!tex) return false;
  const { data, info } = await sharp(Buffer.from(tex.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;

  const uv = part.prim.getAttribute('TEXCOORD_0').getArray();
  const pos = part.pos;
  let umn = 1, umx = 0, vmn = 1, vmx = 0, hits = 0;
  for (let i = 0; i < uv.length / 2; i++) {
    if (!select(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])) continue;
    hits++;
    const u = ((uv[i * 2] % 1) + 1) % 1, v = ((uv[i * 2 + 1] % 1) + 1) % 1;
    if (u < umn) umn = u; if (u > umx) umx = u;
    if (v < vmn) vmn = v; if (v > vmx) vmx = v;
  }
  if (!hits) { console.log(`  ${kind}: no vertices selected, skipped`); return false; }

  // Pad outward so the mark's antialiased edge goes too.
  const padU = (umx - umn) * 0.10 + 2 / w;
  const padV = (vmx - vmn) * 0.10 + 2 / h;
  inpaintRect(data, w, h, ch, (umn - padU) * w, (vmn - padV) * h, (umx + padU) * w, (vmx + padV) * h);

  const out = await sharp(data, { raw: { width: w, height: h, channels: ch } }).jpeg({ quality: 94 }).toBuffer();
  tex.setImage(out).setMimeType('image/jpeg');
  console.log(`  de-branded ${kind}: ${hits} verts → texture rect ` +
    `x ${Math.round(umn * w)}..${Math.round(umx * w)}, y ${Math.round(vmn * h)}..${Math.round(vmx * h)} of ${w}x${h}`);
  return true;
}

if (!IS_BIKE) {
  const badge = parts.find((p) => p.label === 'badge_front');
  const plate = parts.find((p) => p.label === 'plate_front');
  console.log('\nde-branding:');
  if (badge) {
    // The emblem sits on the centreline, on the frontmost skin of the grille bar.
    // Tight: the emblem is a small boss in the middle of a wide bar. Selecting generously
    // erases the grille slats either side of it, which reads as damage rather than debadging.
    const zFront = badge.mx[lengthAxis] - badge.size[lengthAxis] * 0.38;
    const halfW = badge.size[widthAxis] * 0.085;
    await debrand(badge, 'badge', (x, y, z) => {
      const across = [x, y, z][widthAxis];
      const along = [x, y, z][lengthAxis];
      return Math.abs(across - Wd(badge)) < halfW && along > zFront;
    });
    // Keeps its own geometry and material — the mark is simply no longer painted on it.
    badge.label = 'grille_front';
  }
  if (plate) {
    // The whole part IS the plate, so erase its inner field and leave the border.
    await debrand(plate, 'plate', () => true);
  }
}

// ---------------------------------------------------------------------------
// 5. orient + scale into placeholder space, baked into the vertices
// ---------------------------------------------------------------------------
const cos = Math.cos(YAW), sin = Math.sin(YAW);
const rot = (x, z) => [x * cos + z * sin, -x * sin + z * cos];

let rmn = [Infinity, Infinity, Infinity], rmx = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  const acc = p.prim.getAttribute('POSITION');
  const a = acc.getArray();
  for (let i = 0; i < a.length; i += 3) {
    const [x, z] = rot(a[i], a[i + 2]);
    a[i] = x; a[i + 2] = z;
    for (const [k, v] of [[0, x], [1, a[i + 1]], [2, z]]) {
      if (v < rmn[k]) rmn[k] = v;
      if (v > rmx[k]) rmx[k] = v;
    }
  }
  acc.setArray(a);
  const nacc = p.prim.getAttribute('NORMAL');
  if (nacc) {
    const n = nacc.getArray();
    for (let i = 0; i < n.length; i += 3) {
      const [x, z] = rot(n[i], n[i + 2]);
      n[i] = x; n[i + 2] = z;
    }
    nacc.setArray(n);
  }
}
const rsize = rmx.map((v, i) => v - rmn[i]);
const scale = TARGET_LEN ? TARGET_LEN / rsize[0] : 1;
const cxOff = (rmn[0] + rmx[0]) / 2, czOff = (rmn[2] + rmx[2]) / 2;
for (const p of parts) {
  const acc = p.prim.getAttribute('POSITION');
  const a = acc.getArray();
  for (let i = 0; i < a.length; i += 3) {
    a[i] = (a[i] - cxOff) * scale;
    a[i + 1] = (a[i + 1] - rmn[1]) * scale;
    a[i + 2] = (a[i + 2] - czOff) * scale;
  }
  acc.setArray(a);
}
console.log(`\noriented: ${rsize.map((v) => v.toFixed(3)).join(' x ')} -> scale ${scale.toFixed(4)} -> ` +
  `${(rsize[0] * scale).toFixed(3)} x ${(rsize[1] * scale).toFixed(3)} x ${(rsize[2] * scale).toFixed(3)} m`);
const framedHalfW = Math.hypot(rsize[0] * scale, rsize[2] * scale) / 2;
console.log(`frameExtent for data/vehicles: [${framedHalfW.toFixed(2)}, ${(rsize[1] * scale * 0.62).toFixed(2)}]`);

// ---------------------------------------------------------------------------
// 6. rename nodes to the semantic labels and rebuild a flat scene
// ---------------------------------------------------------------------------
/*
 * Several parts legitimately share one label — a sedan has eight or nine painted panels. The
 * effect engine indexes `meshesByName` as Map<string, Mesh[]>, so giving them all the same
 * name makes one paint option drive every panel at once.
 */
const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
const paintClearcoat = clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.07);
for (const p of parts) {
  if (p.label === 'body_paint') {
    const mat = p.prim.getMaterial();
    // Real automotive paint: a coloured base coat under a clear layer. Left at the source's
    // metalness the panels mirror the room instead of showing their colour (§4 paint physics).
    if (mat) {
      mat.setMetallicFactor(0.16).setRoughnessFactor(0.30);
      mat.setExtension('KHR_materials_clearcoat', paintClearcoat);
    }
  }
  p.mesh.setName(p.label);
  p.node.setName(p.label);
}

// Re-parent everything directly under the scene with identity transforms — the world matrix
// is already baked into the vertices, so any surviving parent transform would apply twice.
const scene = root.listScenes()[0];
for (const p of parts) {
  p.node.setMatrix(IDENT);
  p.node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
}
for (const node of root.listNodes()) {
  for (const child of node.listChildren()) node.removeChild(child);
}
for (const node of root.listNodes()) {
  if (!node.getMesh()) node.dispose();
  else scene.addChild(node);
}

// ---------------------------------------------------------------------------
// 7. publish
// ---------------------------------------------------------------------------
const outDir = path.join('public', 'models');
fs.mkdirSync(outDir, { recursive: true });
const countTris = (d) => {
  let n = 0;
  for (const m of d.getRoot().listMeshes()) for (const pr of m.listPrimitives()) n += (pr.getIndices()?.getCount() ?? 0) / 3;
  return Math.round(n);
};

if (VERIFY) {
  const tmp = path.join('.cache', 'models', `${slug}-verify.glb`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  await io.write(tmp, doc);
  console.log(`\nverify build → ${tmp} (${countTris(doc).toLocaleString()} tris, geometry untouched)`);
  process.exit(0);
}

/*
 * The high LOD keeps every source triangle. mid/low exist for AdaptiveQuality on weak phones
 * and are the ONLY place simplification is allowed to run.
 */
const lods = [
  // high: source triangles AND source texture resolution, untouched. These models ship 56-103
  // small per-part textures (mostly 256-512px), so a blanket resize would upscale most of them
  // and cost bytes for nothing.
  { tag: 'high', tris: Infinity, tex: null },
  { tag: 'mid', tris: 70000, tex: 256 },
  { tag: 'low', tris: 35000, tex: 96 },
];
const results = [];
const serialised = await io.writeBinary(doc);

for (const lod of lods) {
  const d = await io.readBinary(serialised);
  const src = countTris(d);
  if (Number.isFinite(lod.tris) && lod.tris < src) {
    await d.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: lod.tris / src, error: 0.003, lockBorder: true }),
      dedup(), prune(),
    );
  }
  await d.transform(
    lod.tex
      ? textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [lod.tex, lod.tex], quality: 80 })
      : textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  const tmp = path.join(outDir, `.tmp-${slug}-${lod.tag}.glb`);
  await io.write(tmp, d);
  const buf = fs.readFileSync(tmp);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const name = `${slug}-${lod.tag}.${hash}.glb`;
  for (const f of fs.readdirSync(outDir)) if (f.startsWith(`${slug}-${lod.tag}.`) && f !== name) fs.unlinkSync(path.join(outDir, f));
  fs.renameSync(tmp, path.join(outDir, name));
  results.push({ tag: lod.tag, url: `/models/${name}`, bytes: buf.length, tris: countTris(d) });
  console.log(`${lod.tag.padEnd(5)} ${String(countTris(d)).padStart(7)} tris  ${(buf.length / 1048576).toFixed(2)} MB  ${name}`);
}

const budget = { high: 3.5, mid: 1.8, low: 0.9 };
console.log('\nbudget (§13):');
for (const r of results) {
  const mb = r.bytes / 1048576;
  console.log(`  ${r.tag.padEnd(5)} ${mb.toFixed(2)} / ${budget[r.tag]} MB  ${mb <= budget[r.tag] ? 'OK' : 'OVER'}`);
}
console.log('\nasset fragment:');
console.log(JSON.stringify({ glbUrl: results[0].url, lodUrls: results.map((r) => r.url) }, null, 2));
