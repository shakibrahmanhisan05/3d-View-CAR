'use client';

/**
 * The model, and the only place effects touch the scene graph.
 *
 * §5.1: NEVER remount on an option change. The scene is loaded once; a selection change
 * traverses it and mutates materials and visibility inside `useLayoutEffect`, so the new
 * state is committed before the browser paints. A colour change is zero network, zero
 * re-parse, and never shows an intermediate frame.
 *
 * §12.4: the placeholder and a real GLB are the same thing from here up — both are a
 * THREE.Object3D carrying the §13 semantic mesh names. That is what makes the Phase 6 asset
 * swap a JSON edit. If it ever needs a change in this file, the abstraction was wrong.
 */

import { useGLTF } from '@react-three/drei';
import { type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { applySelection, createRuntime, disposeRuntime, type EffectRuntime } from '@/lib/configurator/effects';
import { buildPlaceholder } from '@/components/configurator/PlaceholderVehicle';
import { SplitCompare } from '@/components/configurator/SplitCompare';
import { disposeObject3D } from '@/lib/three/materials';
import type { Selection, Vehicle } from '@/lib/types';

export type CompareProps = {
  /** The vehicle as it arrived — usually the group defaults. */
  before: Selection;
  /** 0–1, read per frame so dragging the divider never re-renders React. */
  splitRef: RefObject<number>;
};

export function VehicleModel({
  vehicle,
  selection,
  glbUrl,
  compare,
  onReady,
}: {
  vehicle: Vehicle;
  selection: Selection;
  /** Resolved LOD url, or undefined to use the procedural placeholder. */
  glbUrl?: string;
  /** Present only on the §6.3 modification demo. */
  compare?: CompareProps;
  onReady?: () => void;
}) {
  return glbUrl ? (
    <GltfVehicle vehicle={vehicle} selection={selection} url={glbUrl} compare={compare} onReady={onReady} />
  ) : (
    <ProceduralVehicle vehicle={vehicle} selection={selection} compare={compare} onReady={onReady} />
  );
}

/** Shared effect wiring. Both loaders hand it a root and it does the identical work. */
function useEffectRuntime(
  root: THREE.Object3D | null,
  vehicle: Vehicle,
  selection: Selection,
  onReady?: () => void,
  compare?: CompareProps,
) {
  const runtime = useRef<EffectRuntime | null>(null);
  const readyFired = useRef(false);

  useLayoutEffect(() => {
    if (!root) return;

    // Snapshot + material cache are built ONCE per loaded model (§5.2). Never in a render.
    const created = createRuntime(root, vehicle.optionGroups);
    runtime.current = created;

    return () => {
      disposeRuntime(created);
      runtime.current = null;
      readyFired.current = false;
    };
  }, [root, vehicle.optionGroups]);

  useLayoutEffect(() => {
    if (!root || !runtime.current) return;
    // In compare mode SplitCompare re-applies both selections every frame, so applying here
    // too would be wasted work — but it still has to run once so the first frame is correct.
    applySelection(vehicle.optionGroups, selection, runtime.current);

    if (!readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
    // `onReady` is deliberately not a dependency: it fires once per load, and re-running on
    // a new callback identity would re-announce readiness mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, vehicle.optionGroups, selection]);

  return compare ? (
    <SplitCompare
      runtime={runtime}
      groups={vehicle.optionGroups}
      before={compare.before}
      after={selection}
      splitRef={compare.splitRef}
    />
  ) : null;
}

function ProceduralVehicle({
  vehicle,
  selection,
  compare,
  onReady,
}: {
  vehicle: Vehicle;
  selection: Selection;
  compare?: CompareProps;
  onReady?: () => void;
}) {
  const object = useMemo(
    () => buildPlaceholder(vehicle.asset.placeholder ?? vehicle.segment),
    [vehicle.asset.placeholder, vehicle.segment],
  );

  const splitPass = useEffectRuntime(object, vehicle, selection, onReady, compare);

  useLayoutEffect(() => () => disposeObject3D(object), [object]);

  return (
    <>
      <primitive object={object} scale={vehicle.asset.scale} />
      {splitPass}
    </>
  );
}

function GltfVehicle({
  vehicle,
  selection,
  url,
  compare,
  onReady,
}: {
  vehicle: Vehicle;
  selection: Selection;
  url: string;
  compare?: CompareProps;
  onReady?: () => void;
}) {
  /*
   * `false` turns drei's Draco path off. Our GLBs are meshopt-compressed
   * (scripts/model/step4-finalize.mjs) and drei bundles MeshoptDecoder from
   * three-stdlib locally, whereas its DRACOLoader is pointed at a gstatic CDN —
   * which /pitch, running with the internet switched off, could never reach.
   * Meshopt stays on: it is the third argument and defaults to true.
   */
  const { scene } = useGLTF(url, false);

  /*
   * useGLTF caches by URL, so the same scene object would be shared between two mounts —
   * and the second mount would inherit the first's mutated materials. Cloning gives each
   * configurator its own graph while the geometry and textures stay shared in the cache.
   */
  const object = useMemo(() => scene.clone(true), [scene]);

  const splitPass = useEffectRuntime(object, vehicle, selection, onReady, compare);

  return (
    <>
      <primitive object={object} scale={vehicle.asset.scale} />
      {splitPass}
    </>
  );
}

/** Warm the cache before the canvas mounts — called from the poster's onLoad. */
export function preloadVehicle(url: string) {
  useGLTF.preload(url, false);
}
