/**
 * Textured software render of a part-separated GLB.
 *
 * Used to judge a source model's real appearance before and after processing — the
 * colour-coded part map shows structure but says nothing about whether the vehicle looks
 * like something a showroom owner would accept.
 *
 * With --turntable N it instead renders N evenly spaced frames around the vehicle and writes
 * them as frame-NN.webp, which is what /demo/360 consumes (§8). Frames rather than live 3D is
 * what the real product is too: Omlan photographs a car and we ship images.
 *
 * Usage: node scripts/model/render-parts.mjs <glb> <outPrefix> [width] [height] [--turntable N]
 */
import fs from 'fs';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { writePNG, sub, cross, dot, norm } from './lib-mesh.mjs';

const rawArgs = process.argv.slice(2);
const [input, outPrefix, wArg, hArg] = rawArgs.filter((a) => !a.startsWith('--'));
const tIdx = rawArgs.indexOf('--turntable');
const TURNTABLE = tIdx >= 0 ? Number(rawArgs[tIdx + 1] ?? 32) : 0;
const OUT_W = Number(wArg ?? 900), OUT_H = Number(hArg ?? 640);
const SS = 2;
const W = OUT_W * SS, H = OUT_H * SS;

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);

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
const applyP = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const applyN = (m, x, y, z) => norm([m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z]);
const IDENT = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// Keyed on the Texture OBJECT — see analyze-parts.mjs.
const texCache = new Map();
async function decode(tex) {
  if (!tex) return null;
  if (texCache.has(tex)) return texCache.get(tex);
  const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(512, 512, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { width: info.width, height: info.height, channels: info.channels, data };
  texCache.set(tex, img);
  return img;
}

const parts = [];
async function walk(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      parts.push({
        name: node.getName() || mesh.getName() || 'part',
        pos: prim.getAttribute('POSITION').getArray(),
        nrm: prim.getAttribute('NORMAL')?.getArray() ?? null,
        uv: prim.getAttribute('TEXCOORD_0')?.getArray() ?? null,
        idx: prim.getIndices()?.getArray() ?? null,
        world,
        tex: await decode(mat?.getBaseColorTexture()),
        factor: mat?.getBaseColorFactor() ?? [1, 1, 1, 1],
        metal: mat?.getMetallicFactor() ?? 1,
        rough: mat?.getRoughnessFactor() ?? 1,
      });
    }
  }
  for (const c of node.listChildren()) await walk(c, world);
}
for (const scene of doc.getRoot().listScenes()) for (const n of scene.listChildren()) await walk(n, IDENT);

// world-space vertices + bounds
let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  const out = new Float32Array(p.pos.length);
  const nout = p.nrm ? new Float32Array(p.nrm.length) : null;
  for (let i = 0; i < p.pos.length; i += 3) {
    const w = applyP(p.world, p.pos[i], p.pos[i + 1], p.pos[i + 2]);
    out[i] = w[0]; out[i + 1] = w[1]; out[i + 2] = w[2];
    for (let k = 0; k < 3; k++) { if (w[k] < mn[k]) mn[k] = w[k]; if (w[k] > mx[k]) mx[k] = w[k]; }
    if (nout) {
      const nw = applyN(p.world, p.nrm[i], p.nrm[i + 1], p.nrm[i + 2]);
      nout[i] = nw[0]; nout[i + 1] = nw[1]; nout[i + 2] = nw[2];
    }
  }
  p.wpos = out; p.wnrm = nout;
}
const size = mx.map((v, i) => v - mn[i]);
const centre = [(mn[0] + mx[0]) / 2, mn[1] + size[1] * 0.46, (mn[2] + mx[2]) / 2];
const radius = Math.hypot(...size) / 2;
console.log(`${parts.length} parts | bounds ${size.map((v) => v.toFixed(3)).join(' x ')}`);

const KEY = norm([0.55, 0.72, 0.42]);
const FILL = norm([-0.62, 0.34, -0.3]);
const RIM = norm([-0.3, 0.42, -0.9]);
const aces = (x) => (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
const srgb = (v) => Math.round(255 * Math.min(1, Math.max(0, aces(Math.max(0, v) * 1.1))) ** (1 / 2.2));

const views = TURNTABLE
  ? Array.from({ length: TURNTABLE }, (_, i) => ({
      // Start at the front three-quarter and sweep a full turn, matching how a real
      // turntable shoot is indexed.
      az: Math.PI * 0.5 + (i / TURNTABLE) * Math.PI * 2,
      el: 0.20,
      tag: `frame-${String(i).padStart(2, '0')}`,
    }))
  : [
      { az: Math.PI * 0.30, el: 0.20, tag: 'front34' },
      { az: Math.PI * 0.50, el: 0.07, tag: 'side' },
      { az: Math.PI * 1.30, el: 0.20, tag: 'rear34' },
      { az: 0, el: 0.06, tag: 'front' },
    ];
if (TURNTABLE) fs.mkdirSync(outPrefix, { recursive: true });

for (const v of views) {
  const dist = radius * 2.5;
  const eye = [centre[0] + dist * Math.cos(v.el) * Math.sin(v.az), centre[1] + dist * Math.sin(v.el), centre[2] + dist * Math.cos(v.el) * Math.cos(v.az)];
  const fwd = norm(sub(centre, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const fl = 1 / Math.tan((30 * Math.PI / 180) / 2);
  const aspect = W / H;
  const zbuf = new Float32Array(W * H).fill(Infinity);
  const img = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    for (let x = 0; x < W; x++) {
      const dx = (x / W - 0.5) * 2.1, dy = (y / H - 0.72) * 3.4;
      const pool = Math.max(0, 1 - Math.hypot(dx, dy)) ** 2.2 * 26;
      const o = (y * W + x) * 3;
      img[o] = Math.min(255, 10 + 10 * t + pool);
      img[o + 1] = Math.min(255, 11 + 10 * t + pool);
      img[o + 2] = Math.min(255, 13 + 12 * t + pool * 1.05);
    }
  }

  for (const p of parts) {
    const P = p.wpos, N = p.wnrm, UV = p.uv, idx = p.idx;
    const nT = idx ? idx.length / 3 : P.length / 9;
    const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0], iw = [0, 0, 0];
    for (let t = 0; t < nT; t++) {
      const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2;
      const vi = [a * 3, b * 3, c * 3];
      let ok = true;
      for (let k = 0; k < 3; k++) {
        const q = [P[vi[k]] - eye[0], P[vi[k] + 1] - eye[1], P[vi[k] + 2] - eye[2]];
        const vz = dot(q, fwd);
        if (vz < 0.001) { ok = false; break; }
        sx[k] = (dot(q, right) * fl / aspect / vz * 0.5 + 0.5) * W;
        sy[k] = (1 - (dot(q, up) * fl / vz * 0.5 + 0.5)) * H;
        sz[k] = vz; iw[k] = 1 / vz;
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
          if (z >= zbuf[o]) continue;
          zbuf[o] = z;
          const s = w0 * iw[0] + w1 * iw[1] + w2 * iw[2];
          const p0 = w0 * iw[0] / s, p1 = w1 * iw[1] / s, p2 = w2 * iw[2] / s;
          let nx = 0, ny = 1, nz = 0;
          if (N) {
            nx = p0 * N[vi[0]] + p1 * N[vi[1]] + p2 * N[vi[2]];
            ny = p0 * N[vi[0] + 1] + p1 * N[vi[1] + 1] + p2 * N[vi[2] + 1];
            nz = p0 * N[vi[0] + 2] + p1 * N[vi[1] + 2] + p2 * N[vi[2] + 2];
            const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          }
          let br = p.factor[0], bg = p.factor[1], bb = p.factor[2];
          if (p.tex && UV) {
            const u = p0 * UV[a * 2] + p1 * UV[b * 2] + p2 * UV[c * 2];
            const vv = p0 * UV[a * 2 + 1] + p1 * UV[b * 2 + 1] + p2 * UV[c * 2 + 1];
            let tx = Math.floor((((u % 1) + 1) % 1) * p.tex.width);
            let ty = Math.floor((((vv % 1) + 1) % 1) * p.tex.height);
            if (tx < 0) tx = 0; else if (tx >= p.tex.width) tx = p.tex.width - 1;
            if (ty < 0) ty = 0; else if (ty >= p.tex.height) ty = p.tex.height - 1;
            const to = (ty * p.tex.width + tx) * p.tex.channels;
            br = (p.tex.data[to] / 255) ** 2.2; bg = (p.tex.data[to + 1] / 255) ** 2.2; bb = (p.tex.data[to + 2] / 255) ** 2.2;
          }
          const lamK = Math.max(0, nx * KEY[0] + ny * KEY[1] + nz * KEY[2]);
          const lamF = Math.max(0, nx * FILL[0] + ny * FILL[1] + nz * FILL[2]);
          const lamR = Math.max(0, nx * RIM[0] + ny * RIM[1] + nz * RIM[2]);
          const hemi = ny * 0.5 + 0.5;
          const amb = 0.05 + 0.30 * hemi;
          const vx = -fwd[0], vy = -fwd[1], vz2 = -fwd[2];
          let hx = KEY[0] + vx, hy = KEY[1] + vy, hz = KEY[2] + vz2;
          const hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
          const shin = 2 / Math.max(0.02, p.rough * p.rough) + 2;
          const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), shin) * 0.4;
          const lit = 1.32 * lamK + 0.36 * lamF;
          const rim = 0.28 * lamR ** 2;
          const oo = o * 3;
          img[oo] = srgb(br * (amb + lit) + spec + rim * 0.55);
          img[oo + 1] = srgb(bg * (amb + lit) + spec + rim * 0.58);
          img[oo + 2] = srgb(bb * (amb + lit) + spec + rim * 0.66);
        }
    }
  }
  const name = TURNTABLE ? `${outPrefix}/${v.tag}.webp` : `${outPrefix}-${v.tag}.png`;
  const pipe = sharp(Buffer.from(img), { raw: { width: W, height: H, channels: 3 } })
    .resize(OUT_W, OUT_H, { kernel: 'lanczos3' });
  await (TURNTABLE ? pipe.webp({ quality: 82, effort: 5 }) : pipe.png()).toFile(name);
  if (!TURNTABLE || v.tag.endsWith('00')) console.log('wrote', name);
}
