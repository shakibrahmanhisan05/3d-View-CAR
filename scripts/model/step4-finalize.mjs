/**
 * Step 4 — compress, build LODs, and publish with content-hashed filenames.
 *
 * Meshopt rather than Draco: drei's `useGLTF` bundles MeshoptDecoder from
 * three-stdlib locally, while its Draco path points at a gstatic CDN — and
 * /pitch has to work with the internet switched off (§11).
 *
 * Usage: node scripts/model/step4-finalize.mjs <split.glb> <slug>
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, simplify, prune, dedup, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';

const [input, slug] = process.argv.slice(2);
if (!input || !slug) {
  console.error('usage: step4-finalize.mjs <split.glb> <slug>');
  process.exit(1);
}
await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const outDir = path.join('public', 'models');
fs.mkdirSync(outDir, { recursive: true });

const countTris = (doc) => {
  let n = 0;
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()) n += p.getIndices().getCount() / 3;
  return Math.round(n);
};

const results = [];
// `lockBorder` matters: every part shares a seam with its neighbours, and an
// unlocked simplify pulls those seams apart into visible cracks between, say,
// body_paint and the window trim beside it.
// Texture size is scaled with the LOD too. At 150k triangles the geometry is
// only ~40% of the file — a low LOD that keeps 2048 maps stays over budget no
// matter how hard the mesh is decimated, and the device that asked for the low
// LOD is exactly the one that cannot afford the texture memory either.
//
// Targets are ABSOLUTE triangle counts, not ratios of the high LOD. A ratio makes
// every budget move when the high LOD is re-tuned, which is how mid and low
// silently drifted over §13 when the sedan went from 150k to 260k.
//
// lockBorder is only affordable on the high LOD. The split model has fourteen
// parts and therefore a lot of locked seam, and meshopt stalls well short of an
// aggressive target when none of it may collapse — low stopped at 46% of the
// mesh instead of the 17% asked for. Below high we let seams move: a hairline
// crack at arm's length on a weak phone costs less than blowing the budget that
// weak phone is the entire reason for.
const lods = [
  { tag: 'high', tris: Infinity, tex: 2048, lockBorder: true },
  { tag: 'mid', tris: 90000, tex: 1024, lockBorder: false },
  { tag: 'low', tris: 42000, tex: 512, lockBorder: false },
];

for (const lod of lods) {
  const doc = await io.read(input);
  const sourceTris = countTris(doc);
  if (Number.isFinite(lod.tris) && lod.tris < sourceTris) {
    await doc.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: lod.tris / sourceTris,
        error: 0.004,
        lockBorder: lod.lockBorder,
      }),
      dedup(),
      prune(),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [lod.tex, lod.tex], quality: 82 }),
    );
  }
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));

  const tmp = path.join(outDir, `.tmp-${slug}-${lod.tag}.glb`);
  await io.write(tmp, doc);
  const buf = fs.readFileSync(tmp);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
  const finalName = `${slug}-${lod.tag}.${hash}.glb`;
  const finalPath = path.join(outDir, finalName);

  // drop older builds of the same slug+lod so /public does not accumulate
  for (const f of fs.readdirSync(outDir))
    if (f.startsWith(`${slug}-${lod.tag}.`) && f !== finalName) fs.unlinkSync(path.join(outDir, f));

  fs.renameSync(tmp, finalPath);
  const tris = countTris(doc);
  results.push({ ...lod, url: `/models/${finalName}`, bytes: buf.length, tris });
  console.log(`${lod.tag.padEnd(5)} ${String(tris).padStart(7)} tris  ${(buf.length / 1048576).toFixed(2)} MB  ${finalName}`);
}

const budget = { high: 3.5, mid: 1.8, low: 0.9 };
console.log('\nbudget check (§13):');
for (const r of results) {
  const mb = r.bytes / 1048576;
  console.log(`  ${r.tag.padEnd(5)} ${mb.toFixed(2)} MB / ${budget[r.tag]} MB  ${mb <= budget[r.tag] ? 'OK' : 'OVER'}`);
}

console.log('\ndata/vehicles/*.json asset fragment:');
console.log(JSON.stringify({
  glbUrl: results[0].url,
  lodUrls: results.map((r) => r.url),
}, null, 2));
