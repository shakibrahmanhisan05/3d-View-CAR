/**
 * probe-disc.mjs — find the flat turntable surface inside a fused stage mesh.
 *
 * A disc top is a large horizontal plate: thousands of vertices sharing almost exactly
 * one Y value. Histogram Y finely, take the strongest peak in the lower half, then read
 * the XZ centroid + radius of the vertices sitting on that plane.
 *
 *   node scripts/model/probe-disc.mjs <source.glb>
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [input] = process.argv.slice(2);
if (!input) {
  console.error('usage: probe-disc.mjs <source.glb>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

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
const xf = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

const verts = [];
function walk(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh)
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION').getArray();
      for (let i = 0; i < pos.length; i += 3) verts.push(xf(world, pos[i], pos[i + 1], pos[i + 2]));
    }
  for (const c of node.listChildren()) walk(c, world);
}
for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, IDENT);

let mnY = Infinity, mxY = -Infinity;
for (const v of verts) { if (v[1] < mnY) mnY = v[1]; if (v[1] > mxY) mxY = v[1]; }
const BINS = 600;
const binW = (mxY - mnY) / BINS;
const hist = new Float64Array(BINS);
for (const v of verts) hist[Math.min(BINS - 1, Math.floor((v[1] - mnY) / binW))]++;

// peaks: bins whose count is a local max and unusually large
const order = [...hist.keys()].sort((a, b) => hist[b] - hist[a]);
const peaks = [];
for (const b of order) {
  if (peaks.length >= 6) break;
  if (peaks.some((p) => Math.abs(p.bin - b) < 8)) continue;
  peaks.push({ bin: b, y: mnY + (b + 0.5) * binW, count: hist[b] });
}
console.log('top Y-plane peaks (candidate flat plates):');
for (const p of peaks) console.log(`  y=${p.y.toFixed(4)}  verts=${p.count}  (${((p.y - mnY) / (mxY - mnY) * 100).toFixed(1)}% up)`);

for (const p of peaks) {
  const yLo = mnY + p.bin * binW - binW * 0.5;
  const yHi = mnY + (p.bin + 1) * binW + binW * 0.5;
  let sx = 0, sz = 0, n = 0;
  let xmn = Infinity, xmx = -Infinity, zmn = Infinity, zmx = -Infinity;
  for (const v of verts) {
    if (v[1] < yLo || v[1] > yHi) continue;
    sx += v[0]; sz += v[2]; n++;
    if (v[0] < xmn) xmn = v[0]; if (v[0] > xmx) xmx = v[0];
    if (v[2] < zmn) zmn = v[2]; if (v[2] > zmx) zmx = v[2];
  }
  if (!n) continue;
  console.log(
    `plane y=${p.y.toFixed(4)}: n=${n} centre=(${(sx / n).toFixed(4)}, ${(sz / n).toFixed(4)}) x ${xmn.toFixed(3)}..${xmx.toFixed(3)} z ${zmn.toFixed(3)}..${zmx.toFixed(3)} -> extent ${(xmx - xmn).toFixed(3)} x ${(zmx - zmn).toFixed(3)}`,
  );
}
console.log(`\nmodel Y range: ${mnY.toFixed(4)} .. ${mxY.toFixed(4)}`);
