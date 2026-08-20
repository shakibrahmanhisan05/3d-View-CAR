'use client';

/**
 * Before/after split render (§6.3).
 *
 * "Drag a vertical divider across the canvas to reveal stock versus modified. Two render
 * targets, one canvas."
 *
 * HOW IT WORKS
 * `useFrame` with a priority > 0 takes rendering away from R3F, so this component owns the
 * frame. Each frame it draws the scene TWICE with the scissor test on: once on the left with
 * the stock selection applied, once on the right with the modified selection. Because both
 * passes use the same camera and the same scene graph, the two halves stay perfectly aligned
 * while the user orbits — which a static "before" screenshot could never do.
 *
 * Applying a selection is a walk over a few hundred cached objects, so doing it twice per
 * frame costs microseconds. Nothing is allocated in here.
 *
 * This is the demo for Fast and Furious BD and the Dewanhat accessory shops, where the visual
 * change IS the product being sold.
 */

import { useFrame, useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { applySelection, type EffectRuntime } from '@/lib/configurator/effects';
import type { OptionGroup, Selection } from '@/lib/types';

export function SplitCompare({
  runtime,
  groups,
  before,
  after,
  splitRef,
}: {
  runtime: RefObject<EffectRuntime | null>;
  groups: OptionGroup[];
  /** Usually the group defaults — the vehicle as it arrived. */
  before: Selection;
  after: Selection;
  /** 0–1, read every frame so dragging never triggers a React render. */
  splitRef: RefObject<number>;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useFrame(() => {
    const current = runtime.current;
    if (!current) return;

    const dpr = gl.getPixelRatio();
    const width = Math.floor(size.width * dpr);
    const height = Math.floor(size.height * dpr);
    const boundary = Math.round(width * Math.min(1, Math.max(0, splitRef.current)));

    gl.setViewport(0, 0, width, height);
    gl.setScissorTest(true);

    // Left: the vehicle as it arrived.
    applySelection(groups, before, current);
    gl.setScissor(0, 0, boundary, height);
    gl.autoClear = true;
    gl.render(scene, camera);

    // Right: the vehicle as we would hand it back. autoClear off, or this erases the left.
    applySelection(groups, after, current);
    gl.setScissor(boundary, 0, width - boundary, height);
    gl.autoClear = false;
    gl.render(scene, camera);

    gl.setScissorTest(false);
    gl.autoClear = true;
  }, 1);

  return null;
}
