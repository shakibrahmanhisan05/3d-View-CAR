/**
 * Step 5 — bake orientation and real-world scale into the geometry.
 *
 * The procedural placeholders are authored with +X forward, Y up, sitting on
 * y=0, at true metric size (car 4.626 m, bike 1.984 m long). Every camera
 * position, hotspot and clamp in data/ was tuned against that footprint.
 *
 * The Tripo sedan arrives +Z forward at ~1 m long, so it needs a 90 degree yaw
 * and a uniform scale. Baking that into the vertices — rather than adding a
 * rotation field to VehicleAsset — is what keeps the swap a pure JSON edit
 * (§12.4): the model arrives already in placeholder space with scale 1.
 *
 * Usage: node scripts/model/step5-orient.mjs <in.glb> <out.glb> <yawDeg> <targetLengthM>
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const [input, output, yawDegArg, targetLenArg] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: step5-orient.mjs <in.glb> <out.glb> <yawDeg> <targetLengthM>');
  process.exit(1);
}
const yaw = (Number(yawDegArg ?? 0) * Math.PI) / 180;
const targetLen = Number(targetLenArg);

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(input);
const root = doc.getRoot();

// Parts share vertex buffers, so transform each accessor once — not once per
// primitive, which would rotate the shared buffer a dozen times over.
const positions = new Set();
const normals = new Set();
for (const mesh of root.listMeshes())
  for (const prim of mesh.listPrimitives()) {
    const p = prim.getAttribute('POSITION');
    const n = prim.getAttribute('NORMAL');
    if (p) positions.add(p);
    if (n) normals.add(n);
  }

const cos = Math.cos(yaw), sin = Math.sin(yaw);
const rot = (x, z) => [x * cos + z * sin, -x * sin + z * cos];

// pass 1 — rotate, and measure the rotated extent so scale can be derived
let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity, mnz = Infinity, mxz = -Infinity;
for (const acc of positions) {
  const a = acc.getArray();
  for (let i = 0; i < a.length; i += 3) {
    const [x, z] = rot(a[i], a[i + 2]);
    a[i] = x; a[i + 2] = z;
    if (x < mnx) mnx = x; if (x > mxx) mxx = x;
    if (a[i + 1] < mny) mny = a[i + 1]; if (a[i + 1] > mxy) mxy = a[i + 1];
    if (z < mnz) mnz = z; if (z > mxz) mxz = z;
  }
  acc.setArray(a);
}
const lenX = mxx - mnx;
const scale = targetLen ? targetLen / lenX : 1;
console.log(`rotated extent ${lenX.toFixed(3)} x ${(mxy - mny).toFixed(3)} x ${(mxz - mnz).toFixed(3)}`);
console.log(`scale ${scale.toFixed(4)} -> ${(lenX * scale).toFixed(3)} x ${((mxy - mny) * scale).toFixed(3)} x ${((mxz - mnz) * scale).toFixed(3)} m`);

// pass 2 — scale about the origin, and centre on X/Z while pinning the wheels
// to y=0 so the vehicle stands on the showroom floor exactly like the placeholder
const cxOff = (mnx + mxx) / 2, czOff = (mnz + mxz) / 2;
for (const acc of positions) {
  const a = acc.getArray();
  for (let i = 0; i < a.length; i += 3) {
    a[i] = (a[i] - cxOff) * scale;
    a[i + 1] = (a[i + 1] - mny) * scale;
    a[i + 2] = (a[i + 2] - czOff) * scale;
  }
  acc.setArray(a);
}
// Rotation is orthogonal and the scale is uniform, so normals only need the yaw.
for (const acc of normals) {
  const a = acc.getArray();
  for (let i = 0; i < a.length; i += 3) {
    const [x, z] = rot(a[i], a[i + 2]);
    a[i] = x; a[i + 2] = z;
  }
  acc.setArray(a);
}

await io.write(output, doc);
console.log('wrote', output);
