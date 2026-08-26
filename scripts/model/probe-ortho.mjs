/**
 * probe-ortho.mjs — orthographic point-projection views of a GLB for measuring.
 * Writes top (XZ) and front (XY) scatter PNGs, vertices coloured by height/depth.
 *
 *   node scripts/model/probe-ortho.mjs <source.glb> <outPrefix>
 */
import fs from 'fs';
import zlib from 'zlib';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [input, outPrefix] = process.argv.slice(2);
if (!input || !outPrefix) {
  console.error('usage: probe-ortho.mjs <source.glb> <outPrefix>');
  process.exit(1);
}

let CRCT = null;
function crc32(b) {
  if (!CRCT) {
    CRCT = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1) ^ 0xEDB88320; CRCT[n] = c; }
  }
  let c = -1;
  for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return c ^ -1;
}
function writePNG(path, w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  const chunks = [];
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    chunks.push(len, td, crc);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  chunk('IHDR', ihdr); chunk('IDAT', idat); chunk('IEND', Buffer.alloc(0));
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 13, 10, 26, 10]), ...chunks]));
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

let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const v of verts) for (let k = 0; k < 3; k++) { if (v[k] < mn[k]) mn[k] = v[k]; if (v[k] > mx[k]) mx[k] = v[k]; }
console.log('bounds', mn.map((v) => v.toFixed(3)), '->', mx.map((v) => v.toFixed(3)));

const W = 800, H = 800;
function render(uAxis, vAxis, getC, file) {
  const uRange = mx[uAxis] - mn[uAxis], vRange = mx[vAxis] - mn[vAxis];
  const img = Buffer.alloc(W * H * 3, 12);
  for (const v of verts) {
    const x = Math.min(W - 1, Math.max(0, Math.floor(((v[uAxis] - mn[uAxis]) / uRange) * W)));
    const y = Math.min(H - 1, Math.max(0, Math.floor(((mx[vAxis] - v[vAxis]) / vRange) * H)));
    const o = (y * W + x) * 3;
    img[o] = getC(v)[0]; img[o + 1] = getC(v)[1]; img[o + 2] = getC(v)[2];
  }
  // 0.1-unit grid in model space
  for (let g = Math.ceil(mn[uAxis] * 10) / 10; g <= mx[uAxis]; g += 0.1) {
    const x = Math.floor(((g - mn[uAxis]) / uRange) * W);
    for (let y = 0; y < H; y++) { const o = (y * W + x) * 3; if (img[o] === 12) { img[o] = 40; img[o + 1] = 44; img[o + 2] = 52; } }
  }
  for (let g = Math.ceil(mn[vAxis] * 10) / 10; g <= mx[vAxis]; g += 0.1) {
    const y = Math.floor(((mx[vAxis] - g) / vRange) * H);
    for (let x = 0; x < W; x++) { const o = (y * W + x) * 3; if (img[o] === 12) { img[o] = 40; img[o + 1] = 44; img[o + 2] = 52; } }
  }
  writePNG(file, W, H, img);
  console.log('wrote', file);
}

// TOP: x right, z up. Colour by y (dark = low, light = high).
render(
  0,
  2,
  (v) => {
    const t = (v[1] - mn[1]) / (mx[1] - mn[1]);
    return [40 + t * 200, 40 + t * 200, 50 + t * 205];
  },
  `${outPrefix}-top.png`,
);
// FRONT: x right, y up. Colour by z (dark = far/-z, light = near/+z).
render(
  0,
  1,
  (v) => {
    const t = (v[2] - mn[2]) / (mx[2] - mn[2]);
    return [40 + t * 200, 40 + t * 200, 50 + t * 205];
  },
  `${outPrefix}-front.png`,
);
