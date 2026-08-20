/**
 * Report which part is visible at given pixel coordinates of a standard view.
 *
 * With 56–103 separate parts, matching "the thing on the grille" to a part index by reading
 * bounding boxes is guesswork. This renders the same camera as render-parts.mjs and answers
 * directly: at pixel (x,y) you are looking at part N.
 *
 * Usage: node scripts/model/pick-part.mjs <glb> <view> <x,y> [<x,y> ...]
 *        view = front | front34 | side | rear34 | rear
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { sub, cross, dot, norm } from './lib-mesh.mjs';

const [input, viewName = 'front', ...pixels] = process.argv.slice(2);
const W = 900, H = 640;

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);

const mul = (a, b) => {
  const o = new Float64Array(16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
  return o;
};
const applyP = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const IDENT = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

const parts = [];
function walk(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) for (const prim of mesh.listPrimitives()) parts.push({ index: parts.length, node, mesh, prim, world });
  for (const c of node.listChildren()) walk(c, world);
}
for (const scene of doc.getRoot().listScenes()) for (const n of scene.listChildren()) walk(n, IDENT);

let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  const pos = p.prim.getAttribute('POSITION').getArray();
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const w = applyP(p.world, pos[i], pos[i + 1], pos[i + 2]);
    out[i] = w[0]; out[i + 1] = w[1]; out[i + 2] = w[2];
    for (let k = 0; k < 3; k++) { if (w[k] < mn[k]) mn[k] = w[k]; if (w[k] > mx[k]) mx[k] = w[k]; }
  }
  p.wpos = out;
  p.idx = p.prim.getIndices()?.getArray() ?? null;
}
const size = mx.map((v, i) => v - mn[i]);
const centre = [(mn[0] + mx[0]) / 2, mn[1] + size[1] * 0.46, (mn[2] + mx[2]) / 2];
const radius = Math.hypot(...size) / 2;

const VIEWS = {
  front: { az: 0, el: 0.06 },
  front34: { az: Math.PI * 0.30, el: 0.20 },
  side: { az: Math.PI * 0.50, el: 0.07 },
  rear34: { az: Math.PI * 1.30, el: 0.20 },
  rear: { az: Math.PI, el: 0.06 },
};
const v = VIEWS[viewName] ?? VIEWS.front;
const dist = radius * 2.5;
const eye = [centre[0] + dist * Math.cos(v.el) * Math.sin(v.az), centre[1] + dist * Math.sin(v.el), centre[2] + dist * Math.cos(v.el) * Math.cos(v.az)];
const fwd = norm(sub(centre, eye));
const right = norm(cross(fwd, [0, 1, 0]));
const up = cross(right, fwd);
const fl = 1 / Math.tan((30 * Math.PI / 180) / 2);
const aspect = W / H;

const zbuf = new Float32Array(W * H).fill(Infinity);
const owner = new Int32Array(W * H).fill(-1);

for (const p of parts) {
  const P = p.wpos, idx = p.idx;
  const nT = idx ? idx.length / 3 : P.length / 9;
  const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];
  for (let t = 0; t < nT; t++) {
    const vi = [0, 1, 2].map((c) => (idx ? idx[t * 3 + c] : t * 3 + c) * 3);
    let ok = true;
    for (let k = 0; k < 3; k++) {
      const q = [P[vi[k]] - eye[0], P[vi[k] + 1] - eye[1], P[vi[k] + 2] - eye[2]];
      const vz = dot(q, fwd);
      if (vz < 0.001) { ok = false; break; }
      sx[k] = (dot(q, right) * fl / aspect / vz * 0.5 + 0.5) * W;
      sy[k] = (1 - (dot(q, up) * fl / vz * 0.5 + 0.5)) * H;
      sz[k] = vz;
    }
    if (!ok) continue;
    const minx = Math.max(0, Math.floor(Math.min(...sx))), maxx = Math.min(W - 1, Math.ceil(Math.max(...sx)));
    const miny = Math.max(0, Math.floor(Math.min(...sy))), maxy = Math.min(H - 1, Math.ceil(Math.max(...sy)));
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
        const o = y * W + x;
        if (z < zbuf[o]) { zbuf[o] = z; owner[o] = p.index; }
      }
  }
}

console.log(`view=${viewName} ${W}x${H}`);
for (const spec of pixels) {
  const [x, y] = spec.split(',').map(Number);
  // report the dominant part in a small neighbourhood, which is more robust than one texel
  const tally = new Map();
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const id = owner[yy * W + xx];
      if (id >= 0) tally.set(id, (tally.get(id) ?? 0) + 1);
    }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) { console.log(`  (${x},${y}) → nothing`); continue; }
  const detail = ranked.slice(0, 3).map(([id, n]) => {
    const p = parts[id];
    const tris = p.idx ? p.idx.length / 3 : p.wpos.length / 9;
    return `part ${id} (${n}px, ${tris} tris, mesh "${p.mesh.getName() ?? ''}")`;
  });
  console.log(`  (${x},${y}) → ${detail.join('  |  ')}`);
}
