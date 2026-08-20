/**
 * Dev-only: dump the placeholder scene graph so a rendering oddity can be diagnosed from the
 * numbers rather than from a screenshot. Not shipped, not wired into any build script.
 *
 *   pnpm exec tsx scripts/dev/probe-geometry.ts car 0.9 2.3 0.8
 */
import * as THREE from 'three';
import { buildPlaceholderCar } from '../../src/lib/three/placeholder-car';
import { buildPlaceholderBike } from '../../src/lib/three/placeholder-bike';

const [which = 'car', minX = '-99', maxX = '99', minY = '-99'] = process.argv.slice(2);
const root = which === 'bike' ? buildPlaceholderBike() : buildPlaceholderCar();
root.updateMatrixWorld(true);

const rows: Array<Record<string, string>> = [];
root.traverse((o) => {
  const mesh = o as THREE.Mesh;
  if (!mesh.isMesh) return;
  let node: THREE.Object3D | null = o;
  while (node) { if (!node.visible) return; node = node.parent; }

  const box = new THREE.Box3().setFromObject(mesh);
  if (box.max.x < Number(minX) || box.min.x > Number(maxX) || box.max.y < Number(minY)) return;

  rows.push({
    name: mesh.name,
    material: (mesh.material as THREE.Material).name,
    x: `${box.min.x.toFixed(2)}..${box.max.x.toFixed(2)}`,
    y: `${box.min.y.toFixed(2)}..${box.max.y.toFixed(2)}`,
    z: `${box.min.z.toFixed(2)}..${box.max.z.toFixed(2)}`,
  });
});

console.table(rows);
