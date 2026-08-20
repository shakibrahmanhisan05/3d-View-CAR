/**
 * Render a prepared vehicle coloured by its §13 label, plus body_paint isolated.
 *
 * body_paint is the only label whose accuracy a client can see: those are the meshes a paint
 * option recolours. Everything else keeps its own baked material, so this render exists
 * mainly to prove body_paint covers the panels and nothing else.
 *
 * Usage: node scripts/model/verify-labels.mjs <prepared.glb> <outPrefix>
 */
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { sub, cross, dot, norm } from './lib-mesh.mjs';

const [input, outPrefix] = process.argv.slice(2);
const OUT_W = 900, OUT_H = 640, SS = 2;
const W = OUT_W * SS, H = OUT_H * SS;

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);

const PALETTE = {
  body_paint: [80, 240, 140],
  glass_windshield: [90, 190, 255], glass_side: [70, 170, 240], glass_rear: [60, 150, 225],
  trim_dark: [70, 72, 80],
  chrome_trim: [255, 215, 90],
  headlight_lens: [200, 245, 255],
  taillight_lens: [255, 70, 60],
  interior_seats: [255, 120, 200], interior_dash: [190, 90, 220],
  tyre_front: [30, 30, 34], tyre_rear: [45, 45, 50],
  wheel_fl: [120, 120, 210], wheel_fr: [90, 200, 210], wheel_rl: [210, 150, 90], wheel_rr: [170, 120, 220],
  grille_front: [120, 120, 130], badge_front: [255, 0, 255], plate_front: [255, 160, 0],
};

const parts = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    parts.push({
      label: node.getName(),
      pos: prim.getAttribute('POSITION').getArray(),
      nrm: prim.getAttribute('NORMAL')?.getArray() ?? null,
      idx: prim.getIndices()?.getArray() ?? null,
    });
  }
}
const counts = new Map();
for (const p of parts) counts.set(p.label, (counts.get(p.label) ?? 0) + (p.idx ? p.idx.length / 3 : 0));
console.log('labels:');
[...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(18)} ${String(v).padStart(7)} tris`));

let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const p of parts)
  for (let i = 0; i < p.pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (p.pos[i + k] < mn[k]) mn[k] = p.pos[i + k];
      if (p.pos[i + k] > mx[k]) mx[k] = p.pos[i + k];
    }
const size = mx.map((v, i) => v - mn[i]);
const centre = [(mn[0] + mx[0]) / 2, mn[1] + size[1] * 0.46, (mn[2] + mx[2]) / 2];
const radius = Math.hypot(...size) / 2;

const KEY = norm([0.55, 0.72, 0.42]);

for (const mode of ['labels', 'isolate']) {
  for (const v of [
    { az: Math.PI * 0.30, el: 0.20, tag: 'front34' },
    { az: 0, el: 0.06, tag: 'front' },
  ]) {
    const dist = radius * 2.5;
    const eye = [centre[0] + dist * Math.cos(v.el) * Math.sin(v.az), centre[1] + dist * Math.sin(v.el), centre[2] + dist * Math.cos(v.el) * Math.cos(v.az)];
    const fwd = norm(sub(centre, eye));
    const right = norm(cross(fwd, [0, 1, 0]));
    const up = cross(right, fwd);
    const fl = 1 / Math.tan((30 * Math.PI / 180) / 2);
    const aspect = W / H;
    const zbuf = new Float32Array(W * H).fill(Infinity);
    const img = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) { img[i * 3] = 14; img[i * 3 + 1] = 14; img[i * 3 + 2] = 18; }

    for (const p of parts) {
      let col = PALETTE[p.label] ?? [255, 255, 0];
      if (mode === 'isolate') col = p.label === 'body_paint' ? [80, 240, 140] : [70, 72, 80];
      const P = p.pos, N = p.nrm, idx = p.idx;
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
        let nx = 0, ny = 1, nz = 0;
        if (N) { nx = N[vi[0]]; ny = N[vi[0] + 1]; nz = N[vi[0] + 2]; }
        const shade = 0.42 + 0.58 * Math.abs(nx * KEY[0] + ny * KEY[1] + nz * KEY[2]);
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
    }
    const name = `${outPrefix}-${mode}-${v.tag}.png`;
    await sharp(img, { raw: { width: W, height: H, channels: 3 } }).resize(OUT_W, OUT_H, { kernel: 'lanczos3' }).png().toFile(name);
    console.log('wrote', name);
  }
}
