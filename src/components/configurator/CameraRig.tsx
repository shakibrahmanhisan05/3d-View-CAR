'use client';

/**
 * Camera behaviour (§5.3–§5.5 and §7.1).
 *
 * The rules here are commercial, not aesthetic:
 *  - The camera is CLAMPED. `minPolarAngle 0.15π`, `maxPolarAngle 0.52π` — never under the
 *    floor. A user who loses the vehicle off-screen is a lost lead.
 *  - Damping is on. Undamped orbit reads as amateur within one drag.
 *  - Auto-rotate runs until the first interaction, then stops permanently for the session:
 *    it exists only to signal that the canvas is draggable.
 *  - `prefers-reduced-motion` disables rotation entirely, and the configurator stays fully
 *    usable — that is the actual requirement, not "turn the 3D off".
 *
 * INTERIOR MODE (§7.1) is the same scene and the same GLB, with a different camera and a
 * different controls mode. Never a second scene.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '@/lib/types';

const MIN_POLAR = Math.PI * 0.15;
const MAX_POLAR = Math.PI * 0.52;
const EXTERIOR_FOV = 42;
const INTERIOR_FOV = 62;
const TRANSITION_MS = 1200;

/**
 * Framing (added with the real models).
 *
 * One authored `cameraStart` cannot serve every canvas the vehicle appears in. The homepage
 * bay is full-bleed and roughly 3:1; a `/demo` panel is about 1.4:1; a phone in portrait is
 * narrower than 1:1. At a fixed distance and a fixed 42° lens the same car fills 22% of the
 * hero and would overflow a phone — the vehicle is the headline (§4.1), and on the widest
 * screen it was reading as a thumbnail.
 *
 * So the lens is solved for the viewport instead of hard-coded. Distance is only increased
 * when narrowing is not enough, because moving the camera in is what causes wide-angle
 * distortion and near-plane clipping — cars are shot on a long lens for exactly this reason.
 */
const FILL = 0.64;
const MIN_FOV = 20;
const MAX_FOV = 46;

export type FrameExtent = readonly [halfWidth: number, halfHeight: number];

export function solveFraming({
  start,
  target,
  extent,
  aspect,
  minDistance,
  maxDistance,
}: {
  start: Vec3;
  target: Vec3;
  extent?: FrameExtent;
  aspect: number;
  minDistance: number;
  maxDistance: number;
}): { position: THREE.Vector3; fov: number } {
  const from = new THREE.Vector3(...start);
  const at = new THREE.Vector3(...target);
  const distance = from.distanceTo(at);

  if (!extent || !Number.isFinite(aspect) || aspect <= 0) {
    return { position: from, fov: EXTERIOR_FOV };
  }

  const [halfWidth, halfHeight] = extent;
  // Half-angles the vehicle must subtend to occupy FILL of each axis.
  const byWidth = 2 * Math.atan(halfWidth / FILL / (distance * aspect));
  const byHeight = 2 * Math.atan(halfHeight / FILL / distance);
  const needed = THREE.MathUtils.radToDeg(Math.max(byWidth, byHeight));

  if (needed > MAX_FOV) {
    // Too tight to solve with the lens alone (narrow phone): back off instead, which keeps
    // the widest lens we allow rather than distorting the vehicle to fit.
    const pushed = (distance * Math.tan(THREE.MathUtils.degToRad(needed) / 2)) /
      Math.tan(THREE.MathUtils.degToRad(MAX_FOV) / 2);
    const clamped = THREE.MathUtils.clamp(pushed, minDistance, maxDistance);
    return {
      position: at.clone().addScaledVector(from.clone().sub(at).normalize(), clamped),
      fov: MAX_FOV,
    };
  }

  return { position: from, fov: THREE.MathUtils.clamp(needed, MIN_FOV, MAX_FOV) };
}

/** Constrained look-around inside the cabin: yaw ±120°, pitch ±40° (§7.1). */
const MAX_YAW = THREE.MathUtils.degToRad(120);
const MAX_PITCH = THREE.MathUtils.degToRad(40);

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function CameraRig({
  start,
  target,
  interiorCamera,
  minDistance,
  maxDistance,
  mode,
  resetSignal,
  reducedMotion,
  allowZoom = true,
  frameExtent,
}: {
  start: Vec3;
  target: Vec3;
  interiorCamera?: Vec3;
  minDistance: number;
  maxDistance: number;
  /** [halfWidth, halfHeight] of the vehicle, used to solve the lens for this viewport. */
  frameExtent?: FrameExtent;
  mode: 'exterior' | 'interior';
  /** Increment to snap the camera home. §5.3 requires a visible reset control. */
  resetSignal: number;
  reducedMotion: boolean;
  /**
   * Wheel-to-dolly. OFF on the homepage hero, ON in the full configurators.
   *
   * OrbitControls consumes the wheel event when zoom is enabled. The hero canvas is now
   * full-bleed and 76vh tall, so on a laptop the pointer is almost certainly over it when
   * the visitor first scrolls — and instead of moving down the page they silently dolly the
   * camera into the bodywork. On a dedicated /demo route the canvas is a panel the user has
   * chosen to interact with, and zoom is worth having there.
   */
  allowZoom?: boolean;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const gl = useThree((state) => state.gl);
  const viewWidth = useThree((state) => state.size.width);
  const viewHeight = useThree((state) => state.size.height);

  const framed = useMemo(
    () => solveFraming({
      start,
      target,
      extent: frameExtent,
      aspect: viewHeight > 0 ? viewWidth / viewHeight : 1,
      minDistance,
      maxDistance,
    }),
    [start, target, frameExtent, viewWidth, viewHeight, minDistance, maxDistance],
  );

  // These two drive OrbitControls props, so they are state and not refs — a ref flip would
  // never reach the renderer, and auto-rotate would run forever.
  const [interacted, setInteracted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const transition = useRef<{ from: THREE.Vector3; to: THREE.Vector3; startedAt: number; toInterior: boolean } | null>(null);
  const look = useRef({ yaw: 0, pitch: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);

  // --- Reset ---------------------------------------------------------------
  useEffect(() => {
    if (resetSignal === 0) return;
    camera.position.copy(framed.position);
    camera.fov = framed.fov;
    camera.updateProjectionMatrix();
    controls.current?.target.set(...target);
    look.current = { yaw: 0, pitch: 0 };
    controls.current?.update();
  }, [resetSignal, camera, framed, target]);

  /*
   * Re-solve the lens when the canvas is resized or rotated. Only the FOV is touched: the
   * visitor may have orbited to an angle they chose, and yanking the camera back to the
   * authored position on a phone rotation would throw that away.
   */
  useEffect(() => {
    if (mode !== 'exterior' || transition.current) return;
    camera.fov = framed.fov;
    camera.updateProjectionMatrix();
  }, [camera, framed.fov, mode]);

  // --- Mode transition (§7.1): 1.2s eased path, FOV narrows on the way in --
  useEffect(() => {
    const to = mode === 'interior' && interiorCamera ? new THREE.Vector3(...interiorCamera) : framed.position.clone();
    transition.current = {
      from: camera.position.clone(),
      to,
      startedAt: performance.now(),
      toInterior: mode === 'interior',
    };
    setTransitioning(true);
    if (mode === 'interior') look.current = { yaw: 0, pitch: 0 };
    // `framed` is intentionally read but not depended on: a resize mid-session must not
    // restart the 1.2s interior transition. The resize effect above keeps the lens correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, interiorCamera, camera]);

  // --- Interior look-around ------------------------------------------------
  useEffect(() => {
    if (mode !== 'interior') return;
    const element = gl.domElement;

    const down = (event: PointerEvent) => {
      dragging.current = { x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      const from = dragging.current;
      if (!from) return;
      look.current.yaw = THREE.MathUtils.clamp(
        look.current.yaw - (event.clientX - from.x) * 0.0042,
        -MAX_YAW,
        MAX_YAW,
      );
      look.current.pitch = THREE.MathUtils.clamp(
        look.current.pitch - (event.clientY - from.y) * 0.0042,
        -MAX_PITCH,
        MAX_PITCH,
      );
      dragging.current = { x: event.clientX, y: event.clientY };
    };
    const up = (event: PointerEvent) => {
      dragging.current = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };

    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      dragging.current = null;
    };
  }, [mode, gl]);

  useFrame(() => {
    const active = transition.current;

    if (active) {
      const t = Math.min(1, (performance.now() - active.startedAt) / TRANSITION_MS);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(active.from, active.to, eased);
      const wantedFov = active.toInterior ? INTERIOR_FOV : framed.fov;
      camera.fov = THREE.MathUtils.lerp(camera.fov, wantedFov, eased * 0.35 + 0.05);
      camera.updateProjectionMatrix();

      if (active.toInterior) {
        // Look forward down the bonnet while moving in, so the arrival is not disorienting.
        camera.lookAt(active.to.x + 3, active.to.y - 0.15, active.to.z);
      } else if (controls.current) {
        controls.current.target.set(...target);
        controls.current.update();
      }

      if (t >= 1) {
        transition.current = null;
        setTransitioning(false);
      }
      return;
    }

    if (mode === 'interior') {
      // Yaw about world Y, pitch about the camera's own right axis. Applying both as an
      // Euler in one go would gimbal-lock at the pitch extremes.
      const quaternion = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), look.current.yaw)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), look.current.pitch));

      const forward = new THREE.Vector3(1, -0.06, 0).applyQuaternion(quaternion).normalize();
      camera.lookAt(camera.position.clone().add(forward));
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={mode === 'exterior' && !transitioning}
      makeDefault
      target={target}
      enablePan={false}
      enableZoom={allowZoom}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.7}
      zoomSpeed={0.6}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      autoRotate={!reducedMotion && !interacted && mode === 'exterior'}
      autoRotateSpeed={0.65}
      onStart={() => {
        // Permanently, for the session. Auto-rotation that resumes after a drag fights the
        // user, and a pitch is exactly where that reads as broken.
        setInteracted(true);
      }}
    />
  );
}
