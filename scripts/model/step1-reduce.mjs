/**
 * Step 1 — reduce a raw Tripo GLB to a workable size.
 *
 * The AI models arrive at ~1.9M triangles / ~57 MB against a §13 budget of
 * 120k triangles / 3.5 MB. Decimating BEFORE classification is deliberate:
 * the classifier's visibility pass is O(triangles x viewpoints), and the part
 * boundaries only need to be correct on the mesh we actually ship.
 *
 * Usage: node scripts/model/step1-reduce.mjs <input.glb> <output.glb> [targetTris]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, dedup, prune, resample, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [input, output, targetArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: step1-reduce.mjs <input.glb> <output.glb> [targetTris]');
  process.exit(1);
}
const targetTris = Number(targetArg ?? 120000);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
console.log('reading', input);
const doc = await io.read(input);

const countTris = () => {
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      const idx = p.getIndices();
      n += idx ? idx.getCount() / 3 : p.getAttribute('POSITION').getCount() / 3;
    }
  return Math.round(n);
};

const before = countTris();
console.log('triangles before:', before.toLocaleString());

await MeshoptSimplifier.ready;
const ratio = Math.min(1, targetTris / before);
console.log(`simplify ratio ${ratio.toFixed(5)} -> target ${targetTris.toLocaleString()}`);

await doc.transform(
  // weld first so the simplifier sees a connected surface rather than
  // per-corner duplicates created by the UV atlas seams
  weld({ tolerance: 1e-5 }),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false }),
  dedup(),
  prune(),
  resample(),
  // 8192 basecolor is 4x over the §13 texture budget; 2048 is the cap
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 90 }),
);

console.log('triangles after: ', countTris().toLocaleString());
await io.write(output, doc);
const { size } = await import('fs').then((m) => m.promises.stat(output));
console.log('wrote', output, (size / 1048576).toFixed(2) + ' MB');
