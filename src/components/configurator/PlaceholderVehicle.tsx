'use client';

/**
 * <PlaceholderVehicle> — §12.4.
 *
 * Renders the procedural sedan or motorcycle so Phase 3 never waits on asset acquisition.
 * It hands back a plain THREE.Object3D tree with the §13 semantic mesh names, which is
 * exactly what `useGLTF` hands back for a real file — so the configurator above it cannot
 * tell the difference, and a real GLB drops in by editing vehicle JSON alone.
 *
 * Manifest entry: `placeholder-sedan` / `placeholder-bike` in data/asset-manifest.json.
 */

import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { buildPlaceholderBike } from '@/lib/three/placeholder-bike';
import { buildPlaceholderCar } from '@/lib/three/placeholder-car';
import { disposeObject3D } from '@/lib/three/materials';
import type { Segment } from '@/lib/types';

/** `modification` reuses the car body — that is the whole premise of §6.3. */
export function buildPlaceholder(segment: Segment): THREE.Group {
  return segment === 'motorcycle' ? buildPlaceholderBike() : buildPlaceholderCar();
}

export function PlaceholderVehicle({
  segment,
  onLoad,
}: {
  segment: Segment;
  onLoad?: (root: THREE.Object3D) => void;
}) {
  const object = useMemo(() => buildPlaceholder(segment), [segment]);

  useEffect(() => {
    onLoad?.(object);
    // Geometry, materials and any textures die with the component. Tab-switching on the
    // homepage unmounts this repeatedly and must not leak GPU memory (§5.9).
    return () => disposeObject3D(object);
    // `onLoad` is intentionally excluded: re-running this on a new callback identity would
    // dispose a live scene mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object]);

  return <primitive object={object} />;
}
