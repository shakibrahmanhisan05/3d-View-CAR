/** Print the placeholder bounding boxes so real GLBs can be baked to the same footprint. */
import * as THREE from 'three';
import { buildPlaceholder } from '../../src/components/configurator/PlaceholderVehicle';

for (const seg of ['car', 'motorcycle'] as const) {
  const obj = buildPlaceholder(seg);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const ctr = box.getCenter(new THREE.Vector3());
  console.log(
    seg.padEnd(11),
    'size', [size.x, size.y, size.z].map((v) => v.toFixed(3)).join(' x '),
    '| min', [box.min.x, box.min.y, box.min.z].map((v) => v.toFixed(3)).join(','),
    '| ctr', [ctr.x, ctr.y, ctr.z].map((v) => v.toFixed(3)).join(','),
  );
}
