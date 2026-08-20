/**
 * Render one orthographic view and report the model-space bounding box of the surface
 * visible inside a pixel rectangle.
 *
 * Locating the grille emblem by eye in a 3D bounding box is guesswork; this reads the
 * coordinates straight off the pixels the emblem actually occupies.
 *
 * Usage: node scripts/model/probe-region.mjs <glb> <x0> <y0> <x1> <y1> [res]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { bounds, writePNG, sub, cross, dot, norm, decodeTexture, sampleTex } from './lib-mesh.mjs';

const [input, x0a, y0a, x1a, y1a, resArg] = process.argv.slice(2);
const RES = Number(resArg ?? 800);
const box = [Number(x0a), Number(y0a), Number(x1a), Number(y1a)];

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);

const parts = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) parts.push({ name: node.getName(), prim });
}
const P = parts[0].prim.getAttribute('POSITION').getArray();
const UV = parts[0].prim.getAttribute('TEXCOORD_0').getArray();
const texPart = parts.find((p) => !['body_paint', 'badge_front'].includes(p.name));
const BC = await decodeTexture(texPart.prim.getMaterial().getBaseColorTexture(), 2048);
let total = 0;
for (const p of parts) total += p.prim.getIndices().getCount() / 3;
const I = new Uint32Array(total * 3);
const owner = new Uint8Array(total);
let o = 0;
for (let pi = 0; pi < parts.length; pi++) {
  const idx = parts[pi].prim.getIndices().getArray();
  for (let i = 0; i < idx.length; i += 3) {
    I[o * 3] = idx[i]; I[o * 3 + 1] = idx[i + 1]; I[o * 3 + 2] = idx[i + 2];
    owner[o] = pi; o++;
  }
}
const nT = total;
const B = bounds(P);
const centre = B.ctr;
const radius = Math.hypot(B.size[0], B.size[1], B.size[2]) / 2;

// straight-on front view: camera on +X looking back along -X
const eye = [centre[0] + radius * 3, centre[1], centre[2]];
const fwd = norm(sub(centre, eye));
const right = norm(cross(fwd, [0, 1, 0]));
const up = cross(right, fwd);
const scale = RES / (radius * 1.6);

const zbuf = new Float32Array(RES * RES).fill(Infinity);
const tri = new Int32Array(RES * RES).fill(-1);
const img = Buffer.alloc(RES * RES * 3);

for (let t = 0; t < nT; t++) {
  const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const vi = I[t * 3 + c] * 3;
    const p = [P[vi] - eye[0], P[vi + 1] - eye[1], P[vi + 2] - eye[2]];
    sx[c] = dot(p, right) * scale + RES / 2;
    sy[c] = RES / 2 - dot(p, up) * scale;
    sz[c] = dot(p, fwd);
  }
  const minx = Math.max(0, Math.floor(Math.min(...sx)));
  const maxx = Math.min(RES - 1, Math.ceil(Math.max(...sx)));
  const miny = Math.max(0, Math.floor(Math.min(...sy)));
  const maxy = Math.min(RES - 1, Math.ceil(Math.max(...sy)));
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
      const idx2 = y * RES + x;
      if (z < zbuf[idx2]) { zbuf[idx2] = z; tri[idx2] = t; }
    }
}

// Shade with the baked atlas: the emblem is painted into it, so this is the only
// view in which its exact pixel footprint can be read off directly.
for (let i = 0; i < RES * RES; i++) {
  const t = tri[i];
  if (t < 0) { img[i * 3] = 8; img[i * 3 + 1] = 8; img[i * 3 + 2] = 10; continue; }
  const a = I[t * 3], b = I[t * 3 + 1], c = I[t * 3 + 2];
  const u = (UV[a * 2] + UV[b * 2] + UV[c * 2]) / 3;
  const v = (UV[a * 2 + 1] + UV[b * 2 + 1] + UV[c * 2 + 1]) / 3;
  const s = sampleTex(BC, u, v);
  const isBadge = parts[owner[t]].name === 'badge_front';
  // tint whatever is already labelled badge_front green, so the gap is obvious
  img[i * 3] = isBadge ? Math.round(s[0] * 0.3) : s[0];
  img[i * 3 + 1] = isBadge ? Math.min(255, Math.round(s[1] * 0.3 + 120)) : s[1];
  img[i * 3 + 2] = isBadge ? Math.round(s[2] * 0.3) : s[2];
}
const mark = (x, y) => { const i = (y * RES + x) * 3; img[i] = 255; img[i + 1] = 0; img[i + 2] = 0; };
for (let x = box[0]; x <= box[2]; x++) { mark(x, box[1]); mark(x, box[3]); }
for (let y = box[1]; y <= box[3]; y++) { mark(box[0], y); mark(box[2], y); }
writePNG('.cache/probe-front.png', RES, RES, img);

const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
const names = new Map();
let hits = 0;
for (let y = box[1]; y <= box[3]; y++)
  for (let x = box[0]; x <= box[2]; x++) {
    const t = tri[y * RES + x];
    if (t < 0) continue;
    hits++;
    names.set(parts[owner[t]].name, (names.get(parts[owner[t]].name) ?? 0) + 1);
    for (let c = 0; c < 3; c++) {
      const vi = I[t * 3 + c] * 3;
      for (let k = 0; k < 3; k++) {
        if (P[vi + k] < mn[k]) mn[k] = P[vi + k];
        if (P[vi + k] > mx[k]) mx[k] = P[vi + k];
      }
    }
  }
console.log(`pixels hit: ${hits}`);
console.log('model-space bbox of that region:');
console.log('  min', mn.map((v) => v.toFixed(4)).join(', '));
console.log('  max', mx.map((v) => v.toFixed(4)).join(', '));
console.log('parts under the box:', [...names.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}:${c}`).join('  '));
console.log('wrote .cache/probe-front.png (red rectangle = the probed box)');
