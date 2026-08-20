'use client';

/**
 * Adaptive quality (§5.7) — a continuous frame-rate governor, not a one-shot check.
 *
 * The previous version sampled thirty frames once and, if the average was under 25 fps,
 * halved DPR and dropped to the low LOD. That only ever rescued a device that was already
 * failing: anything between 25 and 60 fps was left alone, and because it latched after the
 * first measurement it could not react to the scene getting heavier later — switching to the
 * interior camera, or a phone thermally throttling three minutes into a pitch.
 *
 * This holds a target instead. Resolution is the right thing to trade for it: a clearcoat
 * vehicle under an environment map is fragment-bound, so pixel count is the single biggest
 * lever, and dropping DPR a notch is far less visible than a stutter. A dealer notices
 * jerky rotation instantly; nobody notices 1.5x instead of 2x on a phone screen.
 *
 * Only when resolution is exhausted and the device is still failing badly do we give up
 * detail and fall to the low LOD — the §5.7 behaviour, now as a last resort rather than the
 * first move.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

/** Ascending. Index 0 is the floor we never go below — past that the vehicle looks broken. */
const DPR_STEPS = [0.7, 0.85, 1, 1.25, 1.5, 1.75, 2];
/** `noUncheckedIndexedAccess` is on, and a clamped index is still an index. */
const stepAt = (index: number) => DPR_STEPS[Math.min(DPR_STEPS.length - 1, Math.max(0, index))] ?? 1;

const WINDOW = 45;
/** Below this we give up a step; above this, and only when steady, we take one back. */
const DOWN_FPS = 54;
const UP_FPS = 58;
/** Long enough that one janky frame — a texture upload, a GC — never moves the level. */
const SETTLE_MS = 800;
/** At the resolution floor and still this slow: the device needs less model, not less pixel. */
const LOD_FPS = 32;

export function AdaptiveQuality({
  active,
  onDowngrade,
}: {
  /** Only measure once the model is actually rendering — decode frames are not gameplay. */
  active: boolean;
  onDowngrade: () => void;
}) {
  const setDpr = useThree((state) => state.setDpr);

  const deltas = useRef<number[]>([]);
  const last = useRef(0);
  const changedAt = useRef(0);
  const level = useRef(-1);
  const downgraded = useRef(false);

  useEffect(() => {
    if (active) return;
    deltas.current = [];
    last.current = 0;
    changedAt.current = 0;
    downgraded.current = false;
  }, [active]);

  // Start at the device's own ratio, capped — never above 2, because a 3x phone rendering
  // this scene at native resolution is the most reliable way to turn a demo into a slideshow.
  useEffect(() => {
    const cap = Math.min(2, window.devicePixelRatio || 1);
    let start = 0;
    for (let i = 0; i < DPR_STEPS.length; i++) if (stepAt(i) <= cap) start = i;
    level.current = start;
    setDpr(stepAt(start));
  }, [setDpr]);

  useFrame(() => {
    if (!active) return;

    const now = performance.now();
    if (last.current === 0) {
      last.current = now;
      return;
    }
    const delta = now - last.current;
    last.current = now;

    // A frame this long is a stall — a decode, a tab regaining focus — not the steady rate.
    if (delta > 250) return;

    deltas.current.push(delta);
    if (deltas.current.length > WINDOW) deltas.current.shift();
    if (deltas.current.length < WINDOW) return;

    if (changedAt.current && now - changedAt.current < SETTLE_MS) return;

    const mean = deltas.current.reduce((sum, v) => sum + v, 0) / deltas.current.length;
    const fps = 1000 / mean;

    if (fps < DOWN_FPS && level.current > 0) {
      level.current -= 1;
      setDpr(stepAt(level.current));
      changedAt.current = now;
      deltas.current = [];
      return;
    }

    if (fps < LOD_FPS && level.current === 0 && !downgraded.current) {
      downgraded.current = true;
      onDowngrade();
      changedAt.current = now;
      deltas.current = [];
      return;
    }

    // Climb back only from a comfortable margin, so we do not oscillate around the target.
    const ceiling = Math.min(2, window.devicePixelRatio || 1);
    if (fps > UP_FPS && level.current < DPR_STEPS.length - 1 && stepAt(level.current + 1) <= ceiling) {
      level.current += 1;
      setDpr(stepAt(level.current));
      changedAt.current = now;
      deltas.current = [];
    }
  });

  return null;
}
