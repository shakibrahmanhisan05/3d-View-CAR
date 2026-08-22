'use client';

/**
 * <Frame> — the cinema container (§6.1).
 *
 * The single most important structural idea in the rebuild. Before it, the hero was a 3D
 * model floating in a flat dark rectangle that spilled to the browser edges; there was no
 * *set* around the vehicle, so the 3D read as a widget bolted onto a page. Inside a frame —
 * rounded corners, a champagne hairline rim, a letterbox, an outer glow — the visitor
 * understands in one glance that they are watching something, and the composition itself
 * becomes the pitch.
 *
 * It wraps the hero on `/` and `/for/[slug]`, the demo panel on the homepage, every
 * `/demo/*` page and the 360° viewer. It does NOT wrap scrollable content sections: the
 * auction sheet lives *outside* the frame, on the deeper obsidian floor, and the move from
 * bay to sheet is the fold the whole page hinges on (§2.1, §3).
 *
 * CLS: the frame reserves its own height before the R3F canvas mounts, via `minHeight` on
 * the shell rather than an intrinsic size, so the poster and then the canvas both land into
 * space that was already there.
 */

import type { CSSProperties, ReactNode } from 'react';
import { PipRail, type PipItem } from './PipRail';
import { cn } from '@/lib/utils';

export type { PipItem };

export function Frame({
  children,
  /**
   * The inner top/bottom bars. True on the hero — it is a poster and it wants the crop.
   * False on `/demo/*`, where the option panel needs every pixel of vertical real estate.
   */
  letterbox = true,
  pips,
  /** Applied to the shell, so the caller owns the height contract and CLS stays at zero. */
  shellStyle,
  className,
  shellClassName,
  /** Frames nested inside a section (the demo panel) drop the page-level max width. */
  bleed = false,
}: {
  children: ReactNode;
  letterbox?: boolean;
  pips?: PipItem[];
  shellStyle?: CSSProperties;
  className?: string;
  shellClassName?: string;
  bleed?: boolean;
}) {
  return (
    <section
      className={cn(
        'relative isolate mx-auto w-full',
        bleed ? '' : 'max-w-[min(94rem,calc(100vw-2rem))]',
        className,
      )}
    >
      {/*
        `.frame-shell` carries the radius, the --ph-frame-shadow (inner champagne highlight +
        outer ember bloom) and the ::before gradient rim. All of it is CSS: the frame must not
        cost a byte of JS, because it is on the critical path of every page that matters.
      */}
      <div className={cn('frame-shell', shellClassName)} style={shellStyle}>
        {/*
          THE PLUME, INSIDE THE FRAME (§2.3).

          `body::before` paints the page's plume, but the shell has an opaque `--ph-bay`
          ground of its own, so none of it reaches the one place the reference actually puts
          it: behind the vehicle. This is that layer — ember low and centre-left, champagne
          high and right, brightest near the floor behind the wheels and falling to black.

          Static. §13 is explicit that animating this is the single fastest way to trash a
          mid-range Android, and it buys nothing.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: [
              'radial-gradient(70% 55% at 38% 78%, color-mix(in oklab, var(--ph-signal) 20%, transparent), transparent 70%)',
              'radial-gradient(55% 45% at 72% 34%, color-mix(in oklab, var(--ph-accent) 11%, transparent), transparent 72%)',
              'radial-gradient(90% 60% at 50% 108%, color-mix(in oklab, var(--ph-signal) 12%, transparent), transparent 65%)',
            ].join(','),
          }}
        />

        {letterbox ? <Letterbox edge="top" /> : null}
        {children}
        {letterbox ? <Letterbox edge="bottom" /> : null}
      </div>

      {/*
        Rendered as a SIBLING of the shell, not a child. The shell is `overflow: hidden` and
        the rail has to track sections far below the frame, so nesting it would clip the one
        element whose entire job is to stay on screen.
      */}
      {pips?.length ? <PipRail items={pips} /> : null}
    </section>
  );
}

/**
 * The letterbox bar. Solid bay at the outer edge fading to transparent, so it crops the
 * composition without looking like a black rectangle laid on top of it.
 *
 * z-[4] puts it above the canvas (z-1) and the stage floor (z-2) but under every piece of
 * chrome (z-20) — the stat pair and the model plate sit *on* the letterbox, exactly as the
 * reference composition does.
 */
function Letterbox({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 z-[4] h-[min(6vh,56px)]',
        edge === 'top' ? 'top-0' : 'bottom-0',
      )}
      style={{
        background:
          edge === 'top'
            ? 'linear-gradient(180deg, var(--ph-bay) 38%, transparent)'
            : 'linear-gradient(0deg, var(--ph-bay) 38%, transparent)',
      }}
    />
  );
}
