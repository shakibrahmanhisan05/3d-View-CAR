'use client';

/**
 * The furniture that sits ON the stage.
 *
 * Minimal by design: monumental type directly on the dark ground, no cards around facts,
 * no glass panels over the canvas. The vehicle is the composition; these are captions.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */

/** The hair-thin arrow. Twelve pixels, 1.5 stroke, drawn inline — reads as print, not UI. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <path
        d="M1 6h9M6.5 2.2 10.3 6l-3.8 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One fact: a figure, an optional unit, a tracked label under it.
 *
 * Numbers get the monumental treatment; names get a size that lets them stay two words
 * wide and wrap — a fifteen-character Bangla paint name at display size would run across
 * the whole stage.
 */
export function Stat({
  figure,
  unit,
  label,
  tinted = false,
  kind = 'figure',
}: {
  figure: string;
  unit?: string;
  label: string;
  /** The paint-driven editorial colour. Used for the fact that IS the paint. */
  tinted?: boolean;
  kind?: 'figure' | 'name';
}) {
  return (
    <div className={kind === 'name' ? 'max-w-[16ch]' : undefined}>
      <p className="flex items-baseline">
        <span
          className={cn('stat-figure', tinted ? 'text-paint' : 'text-bay-ink')}
          style={
            kind === 'name'
              ? { fontSize: 'clamp(0.95rem, 1.4vw, 1.3rem)', letterSpacing: '0.01em', lineHeight: 1.3 }
              : undefined
          }
        >
          {figure}
        </span>
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </p>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function StatPair({ children, className }: { children: ReactNode; className?: string }) {
  /* Naked facts on the stage floor. No card — a card would put glass between the visitor
     and the thing they came to look at. */
  return <div className={cn('flex items-end gap-7 sm:gap-9', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */

/**
 * The struck stamp carrying that section's real code — auction grade on the viewer,
 * pending code on the case study. Outline only; it prints a string the dealer can check.
 */
export function Seal({
  children,
  size = 40,
  tone = 'signal',
  className,
  title,
}: {
  children: ReactNode;
  size?: number;
  tone?: 'signal' | 'accent';
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn('seal', tone === 'accent' && 'seal-accent', className)}
      /*
        Inline width/height/font-size rather than utilities: `.seal` is an unlayered rule
        and therefore outranks every Tailwind utility on the same property. Inline style is
        the only thing that reliably wins.
      */
      style={{ width: size, height: size, fontSize: size >= 64 ? '0.62rem' : undefined }}
      aria-label={title}
      role={title ? 'img' : undefined}
    >
      <span aria-hidden={title ? 'true' : undefined}>{children}</span>
    </span>
  );
}
