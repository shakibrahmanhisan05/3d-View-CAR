/**
 * Shared mesh utilities for the model-salvage pipeline.
 *
 * The Tripo models arrive as ONE fused primitive with ONE baked material, which
 * the configurator cannot drive (§5 — an Effect toggles named meshes, it never
 * swaps the model file). These helpers recover the structure the engine needs:
 * connected components, exterior visibility, and per-triangle texture samples.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
import fs from 'fs';
import zlib from 'zlib';

export async function readMesh(path) {
  const { MeshoptDecoder } = await import('meshoptimizer');
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(path);
  const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
  return {
    doc,
    prim,
    P: prim.getAttribute('POSITION').getArray(),
    N: prim.getAttribute('NORMAL')?.getArray() ?? null,
    UV: prim.getAttribute('TEXCOORD_0')?.getArray() ?? null,
    I: prim.getIndices().getArray(),
  };
}

/** Decode a material texture to a raw RGB buffer at `size`x`size`. */
export async function decodeTexture(texture, size) {
  if (!texture) return null;
  const { data, info } = await sharp(Buffer.from(texture.getImage()))
    .resize(size, size, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, data };
}

export function sampleTex(img, u, v) {
  let x = Math.floor((((u % 1) + 1) % 1) * img.width);
  let y = Math.floor((((v % 1) + 1) % 1) * img.height);
  if (x < 0) x = 0; else if (x >= img.width) x = img.width - 1;
  if (y < 0) y = 0; else if (y >= img.height) y = img.height - 1;
  const o = (y * img.width + x) * img.channels;
  return [img.data[o], img.data[o + 1], img.data[o + 2]];
}

export function bounds(P) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (P[i + k] < mn[k]) mn[k] = P[i + k];
      if (P[i + k] > mx[k]) mx[k] = P[i + k];
    }
  return { mn, mx, size: mx.map((v, i) => v - mn[i]), ctr: mn.map((v, i) => (v + mx[i]) / 2) };
}

/** Union-find over position-welded vertices -> per-triangle component id. */
export function connectedComponents(P, I) {
  const nV = P.length / 3, nT = I.length / 3;
  const grid = 1e-5;
  const map = new Map();
  const rep = new Int32Array(nV);
  for (let i = 0; i < nV; i++) {
    const k = `${Math.round(P[i * 3] / grid)},${Math.round(P[i * 3 + 1] / grid)},${Math.round(P[i * 3 + 2] / grid)}`;
    const e = map.get(k);
    if (e === undefined) { map.set(k, i); rep[i] = i; } else rep[i] = e;
  }
  const parent = new Int32Array(nV);
  for (let i = 0; i < nV; i++) parent[i] = rep[i];
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  for (let t = 0; t < nT; t++) {
    const a = rep[I[t * 3]], b = rep[I[t * 3 + 1]], c = rep[I[t * 3 + 2]];
    union(a, b); union(b, c);
  }
  const roots = new Map();
  const comp = new Int32Array(nT);
  for (let t = 0; t < nT; t++) {
    const r = find(rep[I[t * 3]]);
    let id = roots.get(r);
    if (id === undefined) { id = roots.size; roots.set(r, id); }
    comp[t] = id;
  }
  return { comp, count: roots.size };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export { sub, cross, dot, norm };

/** Fibonacci-sphere directions, used both for visibility and preview cameras. */
export function sphereDirs(n) {
  const out = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = phi * i;
    out.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  return out;
}

/**
 * Rasterise triangle ids from `dirs` viewpoints and mark every triangle that is
 * ever the front-most surface. That set is the exterior shell; everything else
 * is cabin trim the camera can never reach from outside.
 */
export function exteriorVisibility(P, I, dirs, res = 512) {
  const nT = I.length / 3;
  const visible = new Uint8Array(nT);
  const { ctr, size } = bounds(P);
  const radius = Math.hypot(size[0], size[1], size[2]) / 2;
  const zbuf = new Float32Array(res * res);
  const idbuf = new Int32Array(res * res);

  for (const d of dirs) {
    const eye = [ctr[0] + d[0] * radius * 3, ctr[1] + d[1] * radius * 3, ctr[2] + d[2] * radius * 3];
    const fwd = norm(sub(ctr, eye));
    const upRef = Math.abs(fwd[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
    const right = norm(cross(fwd, upRef));
    const up = cross(right, fwd);
    // orthographic: uniform sampling of the silhouette, no perspective bias
    const scale = res / (radius * 2.1);
    zbuf.fill(Infinity);
    idbuf.fill(-1);

    for (let t = 0; t < nT; t++) {
      const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const vi = I[t * 3 + c] * 3;
        const p = [P[vi] - eye[0], P[vi + 1] - eye[1], P[vi + 2] - eye[2]];
        sx[c] = dot(p, right) * scale + res / 2;
        sy[c] = res / 2 - dot(p, up) * scale;
        sz[c] = dot(p, fwd);
      }
      const minx = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2])));
      const maxx = Math.min(res - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2])));
      const miny = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2])));
      const maxy = Math.min(res - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2])));
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
          if (z < zbuf[o]) { zbuf[o] = z; idbuf[o] = t; }
        }
    }
    for (let i = 0; i < idbuf.length; i++) if (idbuf[i] >= 0) visible[idbuf[i]] = 1;
  }
  return visible;
}

// ---- minimal PNG writer (no runtime dep; pipeline is dev-only) ----
let CRCT = null;
function crc32(b) {
  if (!CRCT) {
    CRCT = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c; }
  }
  let c = -1;
  for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}
export function writePNG(path, w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const idat = zlib.deflateSync(raw, { level: 6 });
  const chunks = [];
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    chunks.push(len, td, crc);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  chunk('IHDR', ihdr); chunk('IDAT', idat); chunk('IEND', Buffer.alloc(0));
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]));
}

/** Render the mesh with a per-triangle colour lookup — used to eyeball labels. */
export function renderLabelled(P, N, I, triColor, opts = {}) {
  const W = opts.W ?? 760, H = opts.H ?? 560;
  const { ctr, size } = bounds(P);
  const radius = Math.hypot(size[0], size[1], size[2]) / 2;
  const az = opts.az ?? Math.PI * 0.3, el = opts.el ?? 0.2;
  const dist = radius * 2.4;
  const eye = [
    ctr[0] + dist * Math.cos(el) * Math.sin(az),
    ctr[1] + dist * Math.sin(el),
    ctr[2] + dist * Math.cos(el) * Math.cos(az),
  ];
  const fwd = norm(sub(ctr, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const f = 1 / Math.tan((32 * Math.PI / 180) / 2);
  const aspect = W / H;
  const zbuf = new Float32Array(W * H).fill(Infinity);
  const img = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { img[i * 3] = 16; img[i * 3 + 1] = 16; img[i * 3 + 2] = 20; }
  const L = norm([0.5, 0.85, 0.4]);
  const nT = I.length / 3;
  const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];

  for (let t = 0; t < nT; t++) {
    let ok = true;
    for (let c = 0; c < 3; c++) {
      const vi = I[t * 3 + c] * 3;
      const p = [P[vi] - eye[0], P[vi + 1] - eye[1], P[vi + 2] - eye[2]];
      const vz = dot(p, fwd);
      if (vz < 0.001) { ok = false; break; }
      sx[c] = (dot(p, right) * f / aspect / vz * 0.5 + 0.5) * W;
      sy[c] = (1 - (dot(p, up) * f / vz * 0.5 + 0.5)) * H;
      sz[c] = vz;
    }
    if (!ok) continue;
    const minx = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2])));
    const maxx = Math.min(W - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2])));
    const miny = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2])));
    const maxy = Math.min(H - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2])));
    if (minx > maxx || miny > maxy) continue;
    const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
    if (Math.abs(area) < 1e-12) continue;
    const col = triColor(t);
    if (!col) continue;
    const a0 = I[t * 3] * 3, a1 = I[t * 3 + 1] * 3, a2 = I[t * 3 + 2] * 3;
    const fn = norm(cross(
      [P[a1] - P[a0], P[a1 + 1] - P[a0 + 1], P[a1 + 2] - P[a0 + 2]],
      [P[a2] - P[a0], P[a2 + 1] - P[a0 + 1], P[a2 + 2] - P[a0 + 2]],
    ));
    const lam = Math.abs(dot(fn, L));
    const shade = 0.42 + 0.58 * lam;
    for (let y = miny; y <= maxy; y++)
      for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
        const w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2];
        const o = y * W + x;
        if (z >= zbuf[o]) continue;
        zbuf[o] = z;
        img[o * 3] = Math.min(255, col[0] * shade);
        img[o * 3 + 1] = Math.min(255, col[1] * shade);
        img[o * 3 + 2] = Math.min(255, col[2] * shade);
      }
  }
  return { img, W, H };
}
