/**
 * Dump the structure of a source GLB: node tree, meshes, materials, textures, triangles.
 *
 * The first pair of models arrived as one fused mesh with one baked atlas, which is what
 * forced the whole salvage pipeline. Run this on anything new BEFORE assuming it needs the
 * same treatment — a model that already carries separate parts needs almost none of it.
 */
import fs from 'fs';

const file = process.argv[2];
const buf = fs.readFileSync(file);
if (buf.readUInt32LE(0) !== 0x46546c67) {
  console.error('not a GLB');
  process.exit(1);
}
let off = 12, json = null, binLen = 0;
while (off < buf.length) {
  const cl = buf.readUInt32LE(off);
  const ct = buf.readUInt32LE(off + 4);
  if (ct === 0x4e4f534a) json = JSON.parse(buf.subarray(off + 8, off + 8 + cl).toString('utf8'));
  else if (ct === 0x004e4942) binLen = cl;
  off += 8 + cl + ((4 - (cl % 4)) % 4);
}
const g = json;

console.log('=== ' + file + ' ===');
console.log('size', (buf.length / 1048576).toFixed(2) + ' MB | BIN', (binLen / 1048576).toFixed(2) + ' MB');
console.log('generator:', g.asset?.generator ?? '(none)');
console.log('extensionsUsed:', (g.extensionsUsed ?? []).join(', ') || '(none)');
console.log('counts: nodes', g.nodes?.length ?? 0, '| meshes', g.meshes?.length ?? 0,
  '| materials', g.materials?.length ?? 0, '| textures', g.textures?.length ?? 0,
  '| images', g.images?.length ?? 0, '| animations', g.animations?.length ?? 0);

let tris = 0, verts = 0;
for (const m of g.meshes ?? [])
  for (const p of m.primitives) {
    tris += p.indices != null ? g.accessors[p.indices].count / 3 : g.accessors[p.attributes.POSITION].count / 3;
    verts += g.accessors[p.attributes.POSITION].count;
  }
console.log('TRIANGLES:', Math.round(tris).toLocaleString(), '| VERTICES:', verts.toLocaleString());

console.log('\n--- IMAGES ---');
(g.images ?? []).forEach((im, i) => {
  const size = im.bufferView != null ? g.bufferViews[im.bufferView].byteLength : 0;
  console.log(`  [${i}] ${(im.name ?? im.uri ?? 'unnamed').padEnd(46)} ${im.mimeType ?? ''} ${(size / 1048576).toFixed(2)} MB`);
});

console.log('\n--- MATERIALS ---');
(g.materials ?? []).forEach((m, i) => {
  const p = m.pbrMetallicRoughness ?? {};
  const bc = p.baseColorFactor ? p.baseColorFactor.map((v) => v.toFixed(2)).join(',') : 'tex';
  console.log(`  [${i}] ${(m.name ?? 'unnamed').padEnd(30)} base=${bc.padEnd(22)} metal=${p.metallicFactor ?? 1} rough=${p.roughnessFactor ?? 1}` +
    ` tex=${p.baseColorTexture ? 'Y' : 'n'} alpha=${m.alphaMode ?? 'OPAQUE'} ext=${Object.keys(m.extensions ?? {}).join(',') || '-'}`);
});

console.log('\n--- MESHES (name, primitives, triangles, materials) ---');
(g.meshes ?? []).forEach((m, i) => {
  const t = m.primitives.reduce((a, p) => a + (p.indices != null ? g.accessors[p.indices].count / 3 : 0), 0);
  const mats = m.primitives.map((p) => (p.material != null ? (g.materials[p.material].name ?? p.material) : '-')).join(' | ');
  console.log(`  [${String(i).padStart(3)}] ${(m.name ?? 'unnamed').padEnd(38)} prims=${m.primitives.length} tris=${String(Math.round(t)).padStart(8)}  ${mats}`);
});

console.log('\n--- NODE TREE ---');
function walk(idx, depth) {
  const n = g.nodes[idx];
  const meshName = n.mesh != null ? `  → mesh "${g.meshes[n.mesh].name ?? n.mesh}"` : '';
  console.log('  '.repeat(depth + 1) + `"${n.name ?? '(unnamed ' + idx + ')'}"` + meshName);
  for (const c of n.children ?? []) walk(c, depth + 1);
}
for (const s of g.scenes ?? []) for (const r of s.nodes) walk(r, 0);
