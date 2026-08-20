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
}: {
  preset: EnvironmentPreset;
  segment: Segment;
  quality: 'high' | 'low';
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
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} material={groundMaterial}>
        <circleGeometry args={[isBike ? 9 : 16, 48]} />
      </mesh>

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

      {/* The single directional light permitted by §5.6 — a specular highlight, not lighting. */}
      <directionalLight
        position={preset.id === 'sunset' ? [-6, 3, -2] : [4, 7, 5]}
        intensity={preset.id === 'night' ? 0.25 : 0.55}
        color={preset.id === 'sunset' ? '#FFB067' : '#FFFFFF'}
        castShadow={false}
      />
    </>
  );
}
