'use client';

/**
 * <EnvironmentRig> — the §7.2 environment switch.
 *
 * WHY THERE ARE NO HDRI FILES HERE YET
 * ------------------------------------
 * §7.2 specifies one Poly Haven CC0 HDRI per preset, ≤1 MB. Four of those is 4 MB against a
 * 5 MB total first-load budget (§14) — and the whole point of the switch is that it can be
 * used live, in a showroom, on mobile data.
 *
 * So the presets ship as procedural <Lightformer> rigs baked into a 256px cubemap once, at
 * mount. Zero bytes, zero network, and the reflections on the paint genuinely change between
 * presets — which is the thing that actually sells the feature (§7.2).
 *
 * `EnvironmentPreset.hdriUrl` is honoured the moment it is set, and it wins. Upgrading to real
 * HDRIs is a JSON edit in data/environments.json and nothing else.
 *
 * Manifest entry: `environment-rigs` in data/asset-manifest.json.
 */

import { Environment, Lightformer } from '@react-three/drei';
import type { EnvironmentId, EnvironmentPreset } from '@/lib/types';

/**
 * Automotive lighting is about long soft strips, not point lights: a car body is a mirror,
 * and what you see in it is the *shape of the light source*. Every rig below is built from
 * rectangles because that is what a real photographic studio, a street, and a showroom
 * ceiling all actually are.
 */
const RIGS: Record<EnvironmentId, React.ReactNode> = {
  // Fluorescent ceiling strips running the length of the vehicle, plus low side fill.
  showroom: (
    <>
      {/*
        THREE NARROW CEILING STRIPS, AND DARK WALLS.
        A bonnet is a near-flat mirror. Light it with large bright walls and it reflects one
        uniform white field — the panel goes blank and the car dies. Light it with a few
        narrow strips against a dark room and it reflects STRIPES, which is what reads as an
        expensive automotive render. This is the whole trick, and it costs nothing.
      */}
      <Lightformer form="rect" intensity={3.2} color="#FFFFFF" position={[0, 5.2, 2.6]} rotation={[Math.PI / 2, 0, 0]} scale={[11, 0.5, 1]} />
      <Lightformer form="rect" intensity={3.6} color="#F6FAFF" position={[0, 5.4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[11, 0.7, 1]} />
      <Lightformer form="rect" intensity={3.2} color="#FFFFFF" position={[0, 5.2, -2.6]} rotation={[Math.PI / 2, 0, 0]} scale={[11, 0.5, 1]} />

      {/* Walls: present, but dark. They give the sides shape without flooding the panels. */}
      <Lightformer form="rect" intensity={0.32} color="#8C979E" position={[0, 2, -7]} scale={[14, 5, 1]} />
      <Lightformer form="rect" intensity={0.32} color="#8C979E" position={[0, 2, 7]} rotation={[0, Math.PI, 0]} scale={[14, 5, 1]} />
      <Lightformer form="rect" intensity={0.5} color="#B9C3C9" position={[-8, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[9, 4, 1]} />

      {/* Floor bounce. Without it the wheel wells, sills and rims go to pure black. */}
      <Lightformer form="rect" intensity={0.55} color="#D6DBDE" position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />

      {/* One small hard source for a highlight on the shoulder line and the chrome. */}
      <Lightformer form="ring" intensity={4} color="#FFFFFF" position={[4.5, 3.2, 4]} scale={1.1} />
    </>
  ),

  // Overcast Chattogram daylight: a bright dome above, a pale horizon band, warm road bounce.
  street: (
    <>
      <Lightformer form="rect" intensity={1.9} color="#DCE6EE" position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 16, 1]} />
      <Lightformer form="rect" intensity={1.5} color="#F2F6F8" position={[0, 1.4, -9]} scale={[18, 3.2, 1]} />
      <Lightformer form="rect" intensity={1.5} color="#F2F6F8" position={[0, 1.4, 9]} rotation={[0, Math.PI, 0]} scale={[18, 3.2, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#B7A88E" position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[14, 14, 1]} />
      <Lightformer form="rect" intensity={2.6} color="#FFFFFF" position={[-5, 5, -4]} rotation={[Math.PI / 3, -0.6, 0]} scale={[3, 3, 1]} />
    </>
  ),

  // Low warm key on one side, cool sky opposite. The strongest sales moment on the switch:
  // this is where a buyer finds out what the colour actually does in evening light (§7.2).
  sunset: (
    <>
      <Lightformer form="rect" intensity={9} color="#FF9A45" position={[-8, 1.1, -2.5]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 2.2, 1]} />
      <Lightformer form="circle" intensity={14} color="#FFB067" position={[-9, 1.4, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1.6} />
      <Lightformer form="rect" intensity={1.6} color="#3E5C82" position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 14, 1]} />
      <Lightformer form="rect" intensity={2.4} color="#C9683A" position={[0, 0.9, -9]} scale={[18, 1.6, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#6B4A6E" position={[8, 2.2, 3]} rotation={[0, Math.PI / 2, 0]} scale={[6, 4, 1]} />
    </>
  ),

  // Sodium street lamps and a signboard. Small, hard, high-contrast sources — a dark scene
  // only reads as expensive when the highlights on the paint are sharp.
  night: (
    <>
      <Lightformer form="rect" intensity={0.5} color="#1B2735" position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 16, 1]} />
      <Lightformer form="circle" intensity={22} color="#FFC46B" position={[-3.2, 5, -3]} scale={0.55} />
      <Lightformer form="circle" intensity={16} color="#FFD590" position={[4, 5, 2.4]} scale={0.45} />
      <Lightformer form="rect" intensity={7} color="#4FD2E8" position={[6.5, 2.6, -3.5]} rotation={[0, -Math.PI / 2.6, 0]} scale={[3.4, 1.1, 1]} />
      <Lightformer form="rect" intensity={5} color="#E8452F" position={[-6, 2.2, 3.6]} rotation={[0, Math.PI / 2.4, 0]} scale={[2.6, 0.7, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#2A3946" position={[0, 1.2, -8]} scale={[14, 2, 1]} />
    </>
  ),
};

export function EnvironmentRig({ preset }: { preset: EnvironmentPreset }) {
  if (preset.hdriUrl) {
    return <Environment files={preset.hdriUrl} environmentIntensity={preset.exposure} background={false} />;
  }

  return (
    // `frames={1}` bakes the rig into a cubemap exactly once. Re-rendering it every frame
    // would cost more than the HDRI we are avoiding.
    <Environment key={preset.id} resolution={256} frames={1} environmentIntensity={preset.exposure} background={false}>
      {RIGS[preset.id]}
    </Environment>
  );
}
