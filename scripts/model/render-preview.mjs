import fs from 'fs';
import zlib from 'zlib';

function loadGLB(file) {
  const buf = fs.readFileSync(file);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const cl = buf.readUInt32LE(off), ct = buf.readUInt32LE(off + 4);
    const d = buf.subarray(off + 8, off + 8 + cl);
    if (ct === 0x4E4F534A) json = JSON.parse(d.toString('utf8'));
    else if (ct === 0x004E4942) bin = d;
    off += 8 + cl + ((4 - (cl % 4)) % 4);
  }
  return { json, bin };
}
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function readAccessor(g, bin, idx) {
  const a = g.accessors[idx];
  const bv = g.bufferViews[a.bufferView];
  const TA = CT[a.componentType];
  const nc = NC[a.type];
  const base = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const stride = bv.byteStride;
  if (!stride || stride === nc * TA.BYTES_PER_ELEMENT) {
    return new TA(bin.buffer, bin.byteOffset + base, a.count * nc);
  }
  const out = new TA(a.count * nc);
  for (let i = 0; i < a.count; i++) {
    const src = new TA(bin.buffer, bin.byteOffset + base + i * stride, nc);
    out.set(src, i * nc);
  }
  return out;
}

let CRCT = null;
function crc32(b) {
  if (!CRCT) {
    CRCT = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c; }
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
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]));
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

const file = process.argv[2], outPrefix = process.argv[3];
const { json: g, bin } = loadGLB(file);
const prim = g.meshes[0].primitives[0];
const P = readAccessor(g, bin, prim.attributes.POSITION);
const N = prim.attributes.NORMAL != null ? readAccessor(g, bin, prim.attributes.NORMAL) : null;
const I = readAccessor(g, bin, prim.indices);
const nTri = I.length / 3;
console.log('geometry: ' + (P.length / 3).toLocaleString() + ' verts, ' + nTri.toLocaleString() + ' tris, normals=' + !!N);

let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { if (P[i + k] < mn[k]) mn[k] = P[i + k]; if (P[i + k] > mx[k]) mx[k] = P[i + k]; }
const ctr = mn.map((v, i) => (v + mx[i]) / 2);
const size = mx.map((v, i) => v - mn[i]);
const radius = Math.hypot(size[0], size[1], size[2]) / 2;
console.log('bounds size ' + size.map(n => n.toFixed(3)).join(' x ') + ' | center ' + ctr.map(n => n.toFixed(3)).join(', ') + ' | radius ' + radius.toFixed(3));

const W = 700, H = 520;
const views = [
  { az: Math.PI * 0.30, el: 0.20, tag: 'front34' },
  { az: 0, el: 0.06, tag: 'side' },
  { az: Math.PI * 1.30, el: 0.20, tag: 'rear34' },
  { az: Math.PI * 0.30, el: 0.85, tag: 'high' },
];

for (const v of views) {
  const dist = radius * 2.4;
  const eye = [
    ctr[0] + dist * Math.cos(v.el) * Math.sin(v.az),
    ctr[1] + dist * Math.sin(v.el),
    ctr[2] + dist * Math.cos(v.el) * Math.cos(v.az),
  ];
  const fwd = norm(sub(ctr, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const fov = 32 * Math.PI / 180;
  const f = 1 / Math.tan(fov / 2);
  const aspect = W / H;

  const zbuf = new Float32Array(W * H).fill(Infinity);
  const img = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = Math.round(14 + 8 * t), gg = Math.round(14 + 8 * t), b = Math.round(18 + 10 * t);
    for (let x = 0; x < W; x++) { const o = (y * W + x) * 3; img[o] = r; img[o + 1] = gg; img[o + 2] = b; }
  }

  const L = norm([0.5, 0.8, 0.45]);
  const sx = new Float32Array(3), sy = new Float32Array(3), sz = new Float32Array(3);
  const nx = new Float32Array(3), ny = new Float32Array(3), nz = new Float32Array(3);

  for (let t = 0; t < nTri; t++) {
    let ok = true;
    for (let c = 0; c < 3; c++) {
      const vi = I[t * 3 + c] * 3;
      const p = [P[vi] - eye[0], P[vi + 1] - eye[1], P[vi + 2] - eye[2]];
      const vx = dot(p, right), vy = dot(p, up), vz = dot(p, fwd);
      if (vz < 0.001) { ok = false; break; }
      sx[c] = (vx * f / aspect / vz * 0.5 + 0.5) * W;
      sy[c] = (1 - (vy * f / vz * 0.5 + 0.5)) * H;
      sz[c] = vz;
      if (N) { const ni = I[t * 3 + c] * 3; nx[c] = N[ni]; ny[c] = N[ni + 1]; nz[c] = N[ni + 2]; }
    }
    if (!ok) continue;
    const minx = Math.max(0, Math.floor(Math.min(sx[0], sx[1], sx[2])));
    const maxx = Math.min(W - 1, Math.ceil(Math.max(sx[0], sx[1], sx[2])));
    const miny = Math.max(0, Math.floor(Math.min(sy[0], sy[1], sy[2])));
    const maxy = Math.min(H - 1, Math.ceil(Math.max(sy[0], sy[1], sy[2])));
    if (minx > maxx || miny > maxy) continue;
    const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
    if (Math.abs(area) < 1e-9) continue;
    let fnx = 0, fny = 0, fnz = 0;
    if (!N) {
      const a0 = I[t * 3] * 3, a1 = I[t * 3 + 1] * 3, a2 = I[t * 3 + 2] * 3;
      const e1 = [P[a1] - P[a0], P[a1 + 1] - P[a0 + 1], P[a1 + 2] - P[a0 + 2]];
      const e2 = [P[a2] - P[a0], P[a2 + 1] - P[a0 + 1], P[a2 + 2] - P[a0 + 2]];
      const fn = norm(cross(e1, e2)); fnx = fn[0]; fny = fn[1]; fnz = fn[2];
    }
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
      const w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2];
      const idx = y * W + x;
      if (z >= zbuf[idx]) continue;
      zbuf[idx] = z;
      let Nx, Ny, Nz;
      if (N) {
        Nx = w0 * nx[0] + w1 * nx[1] + w2 * nx[2]; Ny = w0 * ny[0] + w1 * ny[1] + w2 * ny[2]; Nz = w0 * nz[0] + w1 * nz[1] + w2 * nz[2];
        const l = Math.hypot(Nx, Ny, Nz) || 1; Nx /= l; Ny /= l; Nz /= l;
      } else { Nx = fnx; Ny = fny; Nz = fnz; }
      const lam = Math.max(0, Nx * L[0] + Ny * L[1] + Nz * L[2]);
      const vn = Math.abs(Nx * fwd[0] + Ny * fwd[1] + Nz * fwd[2]);
      const rim = Math.pow(1 - vn, 3) * 0.55;
      const amb = 0.22 + 0.16 * (Ny * 0.5 + 0.5);
      const s = Math.min(1, amb + lam * 0.85 + rim);
      const o = idx * 3;
      img[o] = Math.round(255 * Math.pow(s * 0.93, 1 / 1.6));
      img[o + 1] = Math.round(255 * Math.pow(s * 0.95, 1 / 1.6));
      img[o + 2] = Math.round(255 * Math.pow(s * 1.0, 1 / 1.6));
    }
  }
  writePNG(outPrefix + '-' + v.tag + '.png', W, H, img);
  console.log('wrote ' + outPrefix + '-' + v.tag + '.png');
}
