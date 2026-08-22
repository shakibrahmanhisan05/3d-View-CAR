'use client';

/**
 * Bind the editorial text layer to the vehicle's selected paint.
 *
 * `useLayoutEffect` rather than `useEffect`: the tint has to be on <html> before the browser
 * paints the frame that the new selection produced, or the monolith visibly lags the chip by
 * one frame — which on a 6.75rem chip with a 320ms lift reads as the site being broken.
 *
 * On unmount the properties are left in place ON PURPOSE. Scrolling from the hero into the
 * pricing table must not snap the whole page back to champagne; the last vehicle the visitor
 * looked at is the one the paperwork is tinted by. Navigating to a route with no vehicle
 * keeps the last tint for the same reason.
 */

import { useLayoutEffect } from 'react';
import { applyPaintTint } from '@/lib/paint';

export function useApplyPaintTint(hex: string | undefined): void {
  useLayoutEffect(() => {
    applyPaintTint(hex);
  }, [hex]);
}
