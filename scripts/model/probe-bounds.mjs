/**
 * probe-bounds.mjs — print overall + per-primitive world-space bounds of any GLB.
 * Diagnostic for placing a new stage/platform under the vehicles.
 *
 *   node scripts/model/probe-bounds.mjs <source.glb>
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [input] = process.argv.slice(2);
if (!input) {
  console.error('usage: probe-bounds.mjs <source.glb>');
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

let gmn = [Infinity, Infinity, Infinity];
let gmx = [-Infinity, -Infinity, -Infinity];

function walk(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION').getArray();
      const mn = [Infinity, Infinity, Infinity];
      const mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pos.length; i += 3) {
        const w = xf(world, pos[i], pos[i + 1], pos[i + 2]);
        for (let k = 0; k < 3; k++) {
          if (w[k] < mn[k]) mn[k] = w[k];
          if (w[k] > mx[k]) mx[k] = w[k];
          if (w[k] < gmn[k]) gmn[k] = w[k];
          if (w[k] > gmx[k]) gmx[k] = w[k];
        }
      }
      console.log(
        `${node.getName() ?? '(unnamed)'}: min(${mn.map((v) => v.toFixed(2))}) max(${mx.map((v) => v.toFixed(2))}) size(${mx.map((v, i) => (v - mn[i]).toFixed(2))})`,
      );
    }
  }
  for (const c of node.listChildren()) walk(c, world);
}

for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, IDENT);

console.log('\nOVERALL:');
console.log(`  min(${gmn.map((v) => v.toFixed(3))})`);
console.log(`  max(${gmx.map((v) => v.toFixed(3))})`);
console.log(`  size(${gmx.map((v, i) => (v - gmn[i]).toFixed(3))})`);

// Y-histogram — where does mass sit vertically? Tells a disc platform from a full room.
const bins = new Array(20).fill(0);
const h = gmx[1] - gmn[1];
function hist(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices()?.getArray() ?? null;
      const pos = prim.getAttribute('POSITION').getArray();
      const nT = idx ? idx.length / 3 : pos.length / 9;
      for (let t = 0; t < nT; t++) {
        const vi = [0, 1, 2].map((c) => (idx ? idx[t * 3 + c] : t * 3 + c) * 3);
        for (const j of vi) {
          const y = xf(world, pos[j], pos[j + 1], pos[j + 2])[1];
          const b = Math.min(19, Math.floor(((y - gmn[1]) / h) * 20));
          bins[b]++;
        }
      }
    }
  }
  for (const c of node.listChildren()) hist(c, world);
}
for (const scene of root.listScenes()) for (const n of scene.listChildren()) hist(n, IDENT);
console.log('\nvertex Y-histogram (20 bands, bottom→top):');
bins.forEach((n, i) => console.log(`  ${String(i).padStart(2)} ${'█'.repeat(Math.min(60, Math.round((n / Math.max(...bins)) * 60)))} ${n}`));
