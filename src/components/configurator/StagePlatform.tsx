/**
 * The stage platform — the real 3D floor of every bay.
 *
 * Hisan's Tripo-generated circular showroom stage: a turntable disc, a slatted curved
 * backdrop behind it and a light-rig frame over it, supplied as one fused mesh. Processed
 * by `scripts/model/prepare-stage.mjs` (45k tris, 0.43 MB, meshopt + webp atlas) and
 * floored under every vehicle on the site — hero, all three configurator demos, shared
 * builds — so the "showroom" is a place you can see, not a CSS gradient pretending to be
 * one.
 *
 * PLACEMENT. The source is authored around its own origin: the disc's top plate spans
 * y 0→0.035 and its centre sits at z +0.085. The constants below scale the disc to
 * ≈5.9 m (a 4.63 m sedan keeps ~0.6 m of turntable on every side), centre the disc under
 * the vehicle at x/z 0, and drop the disc top to y −0.002 — a hair under the
 * <ContactShadows> plane, so the shadow lands ON the platform rather than fighting it
 * for the same depth.
 *
 * MATERIAL. The baked atlas is black + tan, which is already the site's palette; the
 * clone tints it a step darker and rough so the slats read under the rim light without
 * competing with the paint for brightness. Materials are rebuilt ONCE per mount into the
 * clone — never per frame — and only the clone's materials are disposed on unmount; the
 * geometry and textures stay shared with useGLTF's cache, which owns their lifetime.
 *
 * The backdrop wall is left visible in interior mode too: seen through the greenhouse it
 * reads as the showroom outside the windows, which is exactly what it should be.
 */

import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { STAGE_PLATFORM_URL } from '@/lib/stage-platform';

const SCALE = 8.6;
const DISC_CENTRE_Z = 0.085;
const DISC_TOP_Y = 0.035;

export function StagePlatform() {
  const { scene } = useGLTF(STAGE_PLATFORM_URL);

  const platform = useMemo(() => {
    const clone = scene.clone(true);
    const clonedMaterials: THREE.MeshStandardMaterial[] = [];

    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const srcMat = source instanceof THREE.MeshStandardMaterial ? source : null;
      const material = new THREE.MeshStandardMaterial({
        map: srcMat?.map ?? null,
        normalMap: srcMat?.normalMap ?? null,
        roughnessMap: srcMat?.roughnessMap ?? null,
        metalnessMap: srcMat?.metalnessMap ?? null,
        color: srcMat?.map ? new THREE.Color('#ffffff') : new THREE.Color('#b0b0b0'),
        roughness: srcMat?.roughness ?? 0.62,
        metalness: srcMat?.metalness ?? 0.08,
        envMapIntensity: 0.55,
      });
      mesh.material = material;
      clonedMaterials.push(material);
    });

    (clone as THREE.Object3D & { __phDispose?: () => void }).__phDispose = () => {
      for (const material of clonedMaterials) material.dispose();
    };

    return clone;
  }, [scene]);

  // Dispose only what this mount created — never the shared cache.
  useEffect(
    () => () => {
      (platform as THREE.Object3D & { __phDispose?: () => void }).__phDispose?.();
    },
    [platform],
  );

  return (
    <primitive
      object={platform}
      scale={SCALE}
      position={[0, -(DISC_TOP_Y * SCALE) - 0.002, -(DISC_CENTRE_Z * SCALE)]}
    />
  );
}

useGLTF.preload(STAGE_PLATFORM_URL);
