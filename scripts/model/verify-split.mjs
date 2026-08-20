/**
 * Verify a split GLB: list the named parts and render body_paint isolated.
 *
 * body_paint is the only group whose accuracy is visible to a client — those are
 * the triangles a paint option recolours. Everything else keeps the baked atlas.
 */
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { bounds, writePNG, renderLabelled } from './lib-mesh.mjs';

const [input, outDir = 'assets-src/debug-verify'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const { MeshoptDecoder } = await import('meshoptimizer');
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);
const root = doc.getRoot();

console.log('nodes / named parts:');
const parts = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    const n = prim.getIndices().getCount() / 3;
    parts.push({ name: node.getName(), prim, tris: n, mat: prim.getMaterial()?.getName() });
  }
}
parts.forEach((p) => console.log(`  ${p.name.padEnd(18)} ${String(p.tris).padStart(7)} tris   material=${p.mat}`));
console.log('total tris', parts.reduce((a, p) => a + p.tris, 0).toLocaleString());

// Merge all parts into one index buffer, tagging which part each triangle is from.
const P = parts[0].prim.getAttribute('POSITION').getArray();
const N = parts[0].prim.getAttribute('NORMAL').getArray();
let total = 0;
for (const p of parts) total += p.tris;
const I = new Uint32Array(total * 3);
const owner = new Array(total);
let o = 0;
for (let pi = 0; pi < parts.length; pi++) {
  const idx = parts[pi].prim.getIndices().getArray();
  for (let i = 0; i < idx.length; i += 3) {
    I[o * 3] = idx[i]; I[o * 3 + 1] = idx[i + 1]; I[o * 3 + 2] = idx[i + 2];
    owner[o] = parts[pi].name;
    o++;
  }
}

const views = [
  { az: Math.PI * 0.3, el: 0.2, tag: 'front34' },
  { az: 0, el: 0.05, tag: 'front' },
  { az: Math.PI * 1.3, el: 0.18, tag: 'rear34' },
];

// 1. body_paint isolated — green is what a colour option will repaint
for (const v of views) {
  const { img, W, H } = renderLabelled(P, N, I, (t) => {
    const n = owner[t];
    if (n === 'body_paint') return [70, 240, 130];
    if (n === 'badge_front') return [255, 40, 255];
    return [70, 72, 80];
  }, v);
  writePNG(path.join(outDir, `isolate-body-${v.tag}.png`), W, H, img);
}
console.log('\nwrote isolation renders to', outDir);
