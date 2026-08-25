'use client';

/**
 * The bay floor.
 *
 * Lighting is baked, not real-time (§5.6): the environment map does the work, contact
 * shadows tie the vehicle to the ground, and there is at most ONE directional light —
 * present only for a specular highlight along the shoulder line. No shadow maps anywhere.
 *
 * Realism in automotive web 3D comes from the environment, clearcoat and contact shadows.
 * Not from polygon count. This component is where two of those three live.
 */

import { ContactShadows } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { EnvironmentPreset, Segment } from '@/lib/types';

export function Stage({
  preset,
  segment,
  quality,
  rimLit = false,
  hasFloorPlatform = false,
}: {
  preset: EnvironmentPreset;
  segment: Segment;
  quality: 'high' | 'low';
  /**
   * The framed-stage lighting (§2.5). In the reference composition the UPPER EDGE of the
   * bodywork is lit and the tyres are almost black — that is a lighting decision, not a paint
   * decision, and it is what makes the vehicle read as a silhouette with a warm edge from any
   * angle rather than as a well-lit product shot.
   *
   * So on the framed surfaces we move the single permitted directional light behind and above
   * the vehicle, warm it, and cut the front fill. Everywhere else the neutral rig stays.
   */
  rimLit?: boolean;
  /**
   * True when <StagePlatform> is in the scene: the platform is the floor, and the flat
   * ground disc must get out of its way — it spans the whole bay at the same y, and two
   * coplanar surfaces z-fight.
   */
  hasFloorPlatform?: boolean;
}) {
  const isBike = segment === 'motorcycle';

  // Ground material is rebuilt only when the preset changes — never per frame.
  const groundMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(preset.groundColor),
        roughness: preset.groundRoughness,
        metalness: preset.groundRoughness < 0.4 ? 0.32 : 0.05,
        // The floor is a disc, so its rim meets the background at a hard edge. Fading the
        // material into the fog colour is cheaper than a gradient texture and removes the
        // bright horizon band a bare disc otherwise shows.
        fog: true,
      }),
    [preset.groundColor, preset.groundRoughness],
  );

  return (
    <>
      {/*
        A polished showroom floor reflects; a street does not. Rather than pay for a real
        reflection pass, the low-roughness presets get metalness so the environment map
        itself shows up in the floor. Same visual result, no extra render target.

        OMITTED on the framed surfaces (rimLit) and whenever the StagePlatform mesh is in
        the scene — in both cases something better already occupies the floor: the DOM
        backdrop plus CSS stage floor on the framed hero, the real 3D platform everywhere
        else. A coplanar disc would only z-fight against the platform's turntable.
      */}
      {rimLit || hasFloorPlatform ? null : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} material={groundMaterial}>
          <circleGeometry args={[isBike ? 9 : 16, 48]} />
        </mesh>
      )}

      {/* Contact shadow, not a shadow map. Cheap, and it is what stops the vehicle floating. */}
      {quality === 'high' ? (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={isBike ? 6 : 12}
          blur={2.4}
          far={isBike ? 1.6 : 2.6}
          opacity={preset.id === 'night' ? 0.9 : 0.62}
          resolution={512}
          color="#000000"
          frames={1}
        />
      ) : null}

      {/*
        The single directional light permitted by §5.6 — a specular highlight, not lighting.

        Framed: behind-and-above, warm, and intensity capped at 0.72 so it lifts the shoulder
        line without clipping the clearcoat to white. Unframed: the neutral three-quarter key
        the configurator has always used.
      */}
      <directionalLight
        position={rimLit ? [-2.5, 6.5, -7] : preset.id === 'sunset' ? [-6, 3, -2] : [4, 7, 5]}
        intensity={
          rimLit ? (preset.id === 'night' ? 0.42 : 0.72) : preset.id === 'night' ? 0.25 : 0.55
        }
        color={rimLit ? '#FFC79A' : preset.id === 'sunset' ? '#FFB067' : '#FFFFFF'}
        castShadow={false}
      />

      {/* The reduced front fill that lets the silhouette stay a silhouette. */}
      {rimLit ? (
        <directionalLight position={[3.5, 2.2, 5.5]} intensity={0.16} color="#CFE0FF" castShadow={false} />
      ) : null}
    </>
  );
}
