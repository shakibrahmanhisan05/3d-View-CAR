/**
 * Analyse a part-separated source GLB and render a colour-coded preview.
 *
 * The second pair of models Hisan supplied arrive already split (56 parts on the sedan, 103
 * on the bike) and already inside the §13 triangle budget. That removes the entire reason the
 * first pipeline decimated anything — and decimation is what made the first pair look
 * crushed. So this tool does not touch geometry. It only works out WHICH part is which, so
 * the §13 semantic names can be attached to meshes that already exist.
 *
 * Usage: node scripts/model/analyze-parts.mjs <source.glb> [outDir] [--render]
 */
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
import { writePNG, sub, cross, dot, norm } from './lib-mesh.mjs';

const args = process.argv.slice(2);
const [input, outDir = '.cache/models/parts'] = args.filter((a) => !a.startsWith('--'));
const RENDER = args.includes('--render');
fs.mkdirSync(outDir, { recursive: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

// --- collect parts with their world transform applied -----------------------
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
const apply = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];
const IDENT = new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

const parts = [];
function walk(node, parent) {
  const world = mul(parent, new Float64Array(node.getMatrix()));
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      parts.push({ node, prim, world, index: parts.length });
    }
  }
  for (const child of node.listChildren()) walk(child, world);
}
for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, IDENT);
console.log(`${parts.length} parts`);

// --- per-part geometry + average basecolor ----------------------------------
/*
 * Sample the texture where the mesh's UVs actually land, not the whole image.
 *
 * A flat average over the atlas reported every part on this model as dark grey — the packed
 * charts occupy a fraction of each image and the unused margin is black, so the mean measures
 * empty space rather than the panel. Sampling at triangle-centroid UVs is what separates
 * white paint from black rubber.
 */
// Keyed on the Texture OBJECT, not on byteLength+name: these models leave every texture
// unnamed, so a string key collapses to the byte length alone and distinct images collide.
const texCache = new Map();
async function decode(tex) {
  if (texCache.has(tex)) return texCache.get(tex);
  const size = 256;
  const { data, info } = await sharp(Buffer.from(tex.getImage()))
    .resize(size, size, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { width: info.width, height: info.height, channels: info.channels, data };
  texCache.set(tex, img);
  return img;
}

async function avgColour(prim) {
  const mat = prim.getMaterial();
  const tex = mat?.getBaseColorTexture();
  const factor = mat?.getBaseColorFactor();
  if (!tex) return factor ? [factor[0] * 255, factor[1] * 255, factor[2] * 255] : [128, 128, 128];

  const img = await decode(tex);
  const uv = prim.getAttribute('TEXCOORD_0')?.getArray();
  if (!uv) return [128, 128, 128];
  const idx = prim.getIndices()?.getArray();
  const nT = idx ? idx.length / 3 : uv.length / 6;
  const step = Math.max(1, Math.floor(nT / 2000));
  let r = 0, g = 0, b = 0, n = 0;
  for (let t = 0; t < nT; t += step) {
    const a = idx ? idx[t * 3] : t * 3;
    const c1 = idx ? idx[t * 3 + 1] : t * 3 + 1;
    const c2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
    const u = (uv[a * 2] + uv[c1 * 2] + uv[c2 * 2]) / 3;
    const v = (uv[a * 2 + 1] + uv[c1 * 2 + 1] + uv[c2 * 2 + 1]) / 3;
    let x = Math.floor((((u % 1) + 1) % 1) * img.width);
    let y = Math.floor((((v % 1) + 1) % 1) * img.height);
    if (x < 0) x = 0; else if (x >= img.width) x = img.width - 1;
    if (y < 0) y = 0; else if (y >= img.height) y = img.height - 1;
    const o = (y * img.width + x) * img.channels;
    r += img.data[o]; g += img.data[o + 1]; b += img.data[o + 2];
    n++;
  }
  return n ? [r / n, g / n, b / n] : [128, 128, 128];
}

let gmn = [Infinity, Infinity, Infinity], gmx = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  const pos = p.prim.getAttribute('POSITION').getArray();
  const idx = p.prim.getIndices()?.getArray();
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const world = [];
  for (let i = 0; i < pos.length; i += 3) {
    const w = apply(p.world, pos[i], pos[i + 1], pos[i + 2]);
    world.push(w[0], w[1], w[2]);
    for (let k = 0; k < 3; k++) {
      if (w[k] < mn[k]) mn[k] = w[k];
      if (w[k] > mx[k]) mx[k] = w[k];
      if (w[k] < gmn[k]) gmn[k] = w[k];
      if (w[k] > gmx[k]) gmx[k] = w[k];
    }
  }
  p.worldPos = new Float32Array(world);
  p.idx = idx;
  p.tris = idx ? idx.length / 3 : pos.length / 9;
  p.mn = mn; p.mx = mx;
  p.size = mx.map((v, i) => v - mn[i]);
  p.ctr = mn.map((v, i) => (v + mx[i]) / 2);
  p.colour = await avgColour(p.prim);
  const [r, g, b] = p.colour;
  p.lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mxc = Math.max(r, g, b), mnc = Math.min(r, g, b);
  p.sat = mxc === 0 ? 0 : (mxc - mnc) / mxc;
}
const gsize = gmx.map((v, i) => v - gmn[i]);
console.log('model bounds', gsize.map((v) => v.toFixed(3)).join(' x '), '| min', gmn.map((v) => v.toFixed(3)).join(','));

// Longest axis is the vehicle's length; report positions normalised to it.
const lengthAxis = gsize.indexOf(Math.max(...gsize));
const axisName = ['X', 'Y', 'Z'][lengthAxis];
console.log(`length axis = ${axisName}`);

console.log('\n idx   tris     size (x,y,z)              centre (x,y,z)            RGB            lum   sat');
parts
  .slice()
  .sort((a, b) => b.tris - a.tris)
  .forEach((p) => {
    console.log(
      String(p.index).padStart(4),
      String(p.tris).padStart(7),
      '  ' + p.size.map((v) => v.toFixed(3).padStart(6)).join(','),
      '  ' + p.ctr.map((v) => v.toFixed(3).padStart(6)).join(','),
      '  (' + p.colour.map((v) => String(Math.round(v)).padStart(3)).join(',') + ')',
      String(Math.round(p.lum)).padStart(4),
      p.sat.toFixed(2).padStart(5),
    );
  });

fs.writeFileSync(path.join(outDir, 'parts.json'), JSON.stringify(
  parts.map((p) => ({ index: p.index, tris: p.tris, mn: p.mn, mx: p.mx, size: p.size, ctr: p.ctr, colour: p.colour, lum: p.lum, sat: p.sat })),
  null, 2,
));

// --- optional colour-coded render ------------------------------------------
if (RENDER) {
  const palette = (i) => {
    const h = (i * 137.508) % 360, s = 0.72, l = 0.55;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };
  const ctr = gmn.map((v, i) => v + gsize[i] / 2);
  const radius = Math.hypot(...gsize) / 2;
  const W = 900, H = 640;

  for (const view of [
    { az: Math.PI * 0.3, el: 0.22, tag: 'front34' },
    { az: Math.PI * 1.3, el: 0.22, tag: 'rear34' },
    { az: Math.PI * 0.5, el: 0.06, tag: 'side' },
  ]) {
    const dist = radius * 2.5;
    const eye = [
      ctr[0] + dist * Math.cos(view.el) * Math.sin(view.az),
      ctr[1] + dist * Math.sin(view.el),
      ctr[2] + dist * Math.cos(view.el) * Math.cos(view.az),
    ];
    const fwd = norm(sub(ctr, eye));
    const right = norm(cross(fwd, [0, 1, 0]));
    const up = cross(right, fwd);
    const fl = 1 / Math.tan((32 * Math.PI / 180) / 2);
    const aspect = W / H;
    const zbuf = new Float32Array(W * H).fill(Infinity);
    const img = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) { img[i * 3] = 16; img[i * 3 + 1] = 16; img[i * 3 + 2] = 20; }
    const L = norm([0.5, 0.85, 0.4]);

    for (const p of parts) {
      const col = palette(p.index);
      const P = p.worldPos;
      const idx = p.idx;
      const nT = idx ? idx.length / 3 : P.length / 9;
      const sx = [0, 0, 0], sy = [0, 0, 0], sz = [0, 0, 0];
      for (let t = 0; t < nT; t++) {
        let ok = true;
        const vi = [0, 1, 2].map((c) => (idx ? idx[t * 3 + c] : t * 3 + c) * 3);
        for (let c = 0; c < 3; c++) {
          const q = [P[vi[c]] - eye[0], P[vi[c] + 1] - eye[1], P[vi[c] + 2] - eye[2]];
          const vz = dot(q, fwd);
          if (vz < 0.001) { ok = false; break; }
          sx[c] = (dot(q, right) * fl / aspect / vz * 0.5 + 0.5) * W;
          sy[c] = (1 - (dot(q, up) * fl / vz * 0.5 + 0.5)) * H;
          sz[c] = vz;
        }
        if (!ok) continue;
        const minx = Math.max(0, Math.floor(Math.min(...sx)));
        const maxx = Math.min(W - 1, Math.ceil(Math.max(...sx)));
        const miny = Math.max(0, Math.floor(Math.min(...sy)));
        const maxy = Math.min(H - 1, Math.ceil(Math.max(...sy)));
        if (minx > maxx || miny > maxy) continue;
        const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
        if (Math.abs(area) < 1e-12) continue;
        const e1 = [P[vi[1]] - P[vi[0]], P[vi[1] + 1] - P[vi[0] + 1], P[vi[1] + 2] - P[vi[0] + 2]];
        const e2 = [P[vi[2]] - P[vi[0]], P[vi[2] + 1] - P[vi[0] + 1], P[vi[2] + 2] - P[vi[0] + 2]];
        const fn = norm(cross(e1, e2));
        const shade = 0.42 + 0.58 * Math.abs(dot(fn, L));
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
    writePNG(path.join(outDir, `parts-${view.tag}.png`), W, H, img);
    console.log('wrote', path.join(outDir, `parts-${view.tag}.png`));
  }
}
