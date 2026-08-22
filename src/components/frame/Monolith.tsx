/**
 * <Monolith> — the giant model code painted behind the vehicle (§6.2).
 *
 * This is the one move that separates "3D on a page" from "3D inside a scene". Three real
 * depth planes stack up: the plume backdrop, this wordmark, and the vehicle in front of it —
 * and because the R3F canvas above is transparent, the roofline genuinely occludes the
 * letterforms. Nothing else in the composition buys as much for as little.
 *
 * It takes the CAR'S COLOUR, not a fixed accent. In the reference composition the giant model
 * number is painted in the vehicle's own orange, and that is what makes the type read as part
 * of the set rather than as a watermark laid over it. `--ph-monolith` is a mix of
 * `--ph-paint` into the bay, so it moves with every chip the visitor taps.
 *
 * NO MOTION LIBRARY HERE, AND IT IS NOT AN OVERSIGHT. The segment swap wants a 350ms opacity
 * cross-fade; doing that with AnimatePresence pulled motion's animation core into the
 * first-load bundle of all three `/demo/*` routes — 44 kB on the pages with the least room
 * for it, to fade one <span>. The `key` makes React replace the node when the code changes,
 * and a fresh node replays `.monolith-in`. Same 350ms, zero bytes, and the global
 * reduced-motion rule already collapses it to an instant swap.
 *
 * This is also why the file is not `'use client'` — nothing in it is interactive, so it
 * renders on the server wherever its caller does.
 *
 * `aria-hidden`: it is a decorative repeat of the model code, which <ModelPlate> already
 * announces. A screen reader hearing "SDG-1500" twice in the hero is noise.
 */

import { monolithIsNarrow } from '@/lib/model-code';
import { cn } from '@/lib/utils';

export function Monolith({
  code = 'PHOENIX 3D',
  scale = 1,
  className,
}: {
  code?: string;
  scale?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden opacity-30 select-none',
        className,
      )}
    >
      <span
        key={code}
        lang="en"
        className="stroke-text font-display font-900 uppercase tracking-[0.22em] whitespace-nowrap text-[clamp(4rem,14vw,14rem)] leading-none text-center"
      >
        PHOENIX 3D
      </span>
      <span
        lang="en"
        className="sheet-code text-[clamp(0.65rem,1.2vw,1.1rem)] tracking-[0.4em] uppercase text-accent-gold/40 mt-2 font-mono"
      >
        SHOWROOM • HYPER-REAL 3D STUDIO • {code}
      </span>
    </div>
  );
}

/**
 * <StageFloor> — the ground the vehicle stands on (§6.4).
 *
 * A shallow specular streak plus a one-pixel horizon line at 22% height. Zero JS, zero
 * raster, no motion. Without it the hero reads as a cutout pasted onto paper; with it the
 * vehicle is standing in a lit room.
 *
 * z-2: above the canvas, below every piece of DOM chrome, so the streak passes *under* the
 * wheels rather than floating over them.
 */
export function StageFloor({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('stage-floor z-[2]', className)} />;
}
