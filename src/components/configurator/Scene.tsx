'use client';

/**
 * The entire R3F tree, and the ONLY module that imports three.js at runtime.
 *
 * This file is loaded through `dynamic(..., { ssr: false })` from ConfiguratorRoot, which is
 * what keeps three.js out of the main bundle (§14). Nothing outside this file may import
 * @react-three/* or three — check with `pnpm analyze` before adding an import here.
 */

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
import { EnvironmentRig } from './EnvironmentRig';
import { HotspotLayer } from './HotspotLayer';
import { RenderGate } from './RenderGate';
import { Stage } from './Stage';
import { StagePlatform } from './StagePlatform';
import { VehicleModel, type CompareProps } from './VehicleModel';
import type { EnvironmentPreset, Selection, Vehicle } from '@/lib/types';

export type SceneProps = {
  vehicle: Vehicle;
  selection: Selection;
  environment: EnvironmentPreset;
  mode: 'exterior' | 'interior';
  quality: 'high' | 'low';
  resetSignal: number;
  reducedMotion: boolean;
  showHotspots: boolean;
  /** See CameraRig — the hero disables wheel-dolly so the page still scrolls over it. */
  allowZoom?: boolean;
  /**
   * Render the canvas OVER whatever is behind it instead of painting the environment colour.
   *
   * The framed hero needs this: the vehicle's roofline must occlude the backdrop the way it
   * would in a real room, and that only reads if the canvas has no ground of its own. The
   * bay colour is painted by CSS under the canvas, and the StagePlatform mesh supplies the
   * physical floor.
   *
   * Fog goes with it: fog is a distance blend towards the background colour, and with no
   * background there is nothing to blend towards — leaving it on washes the far end of the
   * vehicle to transparent.
   */
  transparentBg?: boolean;
  /** Present only on the §6.3 modification demo. */
  compare?: CompareProps;
  onReady: () => void;
  onDowngrade: () => void;
};

export default function Scene({
  vehicle,
  selection,
  environment,
  mode,
  quality,
  resetSignal,
  reducedMotion,
  showHotspots,
  allowZoom,
  transparentBg = false,
  compare,
  onReady,
  onDowngrade,
}: SceneProps) {
  const { asset } = vehicle;
  const glbUrl = quality === 'low' ? (asset.lodUrls?.[2] ?? asset.glbUrl) : asset.glbUrl;

  return (
    <Canvas
      /*
        Initial ratio only. AdaptiveQuality takes ownership of DPR on the first frame and
        governs it against a 60fps target from then on, so the range here just needs to be a
        sane starting point rather than the policy.
      */
      dpr={[0.7, 2]}
      gl={{
        antialias: quality === 'high',
        alpha: transparentBg,
        powerPreference: 'high-performance',
        // The scene is authored in linear space with a physical environment; ACES is what
        // stops bright showroom lightformers from clipping to flat white on the paint.
        preserveDrawingBuffer: false,
      }}
      camera={{ position: asset.cameraStart, fov: 42, near: 0.08, far: 120 }}
      frameloop="always"
      aria-hidden="true"
    >
      {transparentBg ? null : (
        <>
          <color attach="background" args={[environment.background]} />
          <fog attach="fog" args={[environment.background, 14, 42]} />
        </>
      )}

      <Suspense fallback={null}>
        <EnvironmentRig preset={environment} />
        <StagePlatform />
        {/* The platform IS the floor now; the flat ground disc only renders without one. */}
        <Stage
          preset={environment}
          segment={vehicle.segment}
          quality={quality}
          rimLit={transparentBg}
          hasFloorPlatform
        />
        <VehicleModel vehicle={vehicle} selection={selection} glbUrl={glbUrl} compare={compare} onReady={onReady} />
        <HotspotLayer
          hotspots={vehicle.hotspots}
          selection={selection}
          visible={showHotspots && mode === 'exterior'}
        />
      </Suspense>

      <CameraRig
        start={asset.cameraStart}
        frameExtent={asset.frameExtent}
        target={asset.cameraTarget}
        interiorCamera={asset.interiorCamera}
        minDistance={asset.minDistance}
        maxDistance={asset.maxDistance}
        mode={mode}
        resetSignal={resetSignal}
        reducedMotion={reducedMotion}
        allowZoom={allowZoom}
      />

      <AdaptiveQuality active={quality === 'high'} onDowngrade={onDowngrade} />
      <RenderGate />
    </Canvas>
  );
}
