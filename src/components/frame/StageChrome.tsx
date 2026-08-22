'use client';

/**
 * The furniture that sits ON the stage — the four objects the reference composition hangs in
 * the corners of its frame, rebuilt on Phoenix's own material (§7.1, §2.6–2.8).
 *
 *   <StatPair>    bottom-left    two facts, monumental, no card around them
 *   <ModelPlate>  bottom-centre  the chassis code, huge and white, one plain sentence under it
 *   <ExploreCard> bottom-right   a second angle plus a gradient pill into the full configurator
 *   <Seal>        corners        a struck disk carrying a code — the editorial artefact
 *
 * None of them is a card. That is the point: the reference puts monumental type directly onto
 * the image, and the instinct to wrap each fact in a glass rectangle is exactly the instinct
 * that produced the template the rebuild exists to replace (§19: no glassmorphism over the
 * canvas — the transparent canvas, the plume and the stage floor already read as depth, and a
 * backdrop-blur layer on top would flatten all three).
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { VehicleSilhouette } from '@/components/configurator/VehicleSilhouette';
import type { Segment } from '@/lib/types';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */

/**
 * The hair-thin arrow. Twelve pixels, 1.5 stroke, drawn inline.
 *
 * §19: no new icon library, and not lucide either — lucide's ArrowRight is a 24px grid glyph
 * that reads as UI chrome. This one reads as a printed mark, which is the whole difference
 * between the pill looking designed and looking generated.
 */
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
 * One monumental fact: a figure, an optional unit, a tracked-out label under it.
 *
 * `kind` matters more than it looks. The reference pairs `740 hp` with `332 km/h` — two short
 * numerals, both at display size. Our second fact is often a real manufacturer paint name
 * ("পার্ল হোয়াইট থ্রি", "Attitude Black Mica"), and a fifteen-character Bangla string set at
 * 3.25rem monospace runs straight across the model plate and into the chip strip. Numbers get
 * the monumental treatment; names get a size that lets them stay two words wide and wrap.
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
          className={cn('stat-figure', tinted ? 'text-paint' : 'text-ink')}
          style={
            kind === 'name'
              ? { fontSize: 'clamp(1rem, 1.5vw, 1.4rem)', letterSpacing: '0.01em', lineHeight: 1.25 }
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
  return <div className={cn('flex flex-col gap-5 sm:gap-7', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */

export function ModelPlate({
  code,
  sub,
  className,
}: {
  code: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      {/*
        lang="en" on its own node: the code is Latin in both locales and must never be read
        out with Bangla phonetics, nor pasted into the middle of translated body copy (§19).
      */}
      <p className="model-plate" lang="en">
        {code}
      </p>
      <p className="mt-3 max-w-[26ch] text-xs leading-relaxed text-ink-soft sm:text-sm">{sub}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The floating explore card. A pale thumbnail of the vehicle from a second angle, and a
 * gradient pill under it.
 *
 * The pale ground is deliberate and it is the only light rectangle in the whole composition —
 * which is exactly why the eye finds it, and why the CTA under it gets pressed.
 */
export function ExploreCard({
  href,
  label,
  angleLabel,
  segment,
  paintHex,
  posterUrl,
  className,
}: {
  href: string;
  label: string;
  angleLabel: string;
  segment: Segment;
  paintHex: string;
  posterUrl?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-[9.5rem] flex-col gap-2 sm:w-[11rem]', className)}>
      <div className="relative overflow-hidden rounded-xl bg-[#E7E8EA] shadow-elev-lg ring-1 ring-black/20">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- same reasoning as the
          // poster: this is a decorative thumbnail on the critical path, not content.
          <img src={posterUrl} alt="" width={176} height={112} className="h-[4.75rem] w-full object-cover sm:h-[5.5rem]" />
        ) : (
          <VehicleSilhouette
            segment={segment}
            paintHex={paintHex}
            onLight
            className="h-[4.75rem] w-full p-2 sm:h-[5.5rem]"
          />
        )}
        <span className="sheet-code absolute bottom-1 left-2 text-[0.55rem] text-black/45">{angleLabel}</span>
      </div>

      <Link
        href={href}
        className="tap group flex items-center justify-center gap-2 rounded-full px-3 text-center text-xs font-600 leading-tight text-signal-ink shadow-elev transition-[filter,box-shadow] duration-200 hover:shadow-glow hover:brightness-110"
        style={{
          /* §19: gradients are for the plume and this pill. Nowhere else on the site. */
          background:
            'linear-gradient(90deg, var(--ph-signal), color-mix(in oklab, var(--ph-signal) 62%, var(--ph-accent)))',
        }}
      >
        <span>{label}</span>
        <Arrow className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The struck seal. One per section, carrying that section's real code — the auction-grade on
 * the 360° viewer, `SEC-05 · OUT` on the ROI ledger, `FORM-A` on the contact envelope.
 *
 * It must never read as decoration: every seal on the site prints a string the dealer can
 * check against something (§10, §11 of the brief).
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
        Inline width/height/font-size rather than utilities: `.seal` is an unlayered rule and
        therefore outranks every Tailwind utility on the same property, so a `size-20` passed
        through className would silently lose. Inline style is the only thing that reliably
        wins over both.

        0.68rem at 64px+ keeps a six-character code (`SEC-05`) inside the disc's inscribed
        square; 0.8rem overflowed it.
      */
      style={{ width: size, height: size, fontSize: size >= 64 ? '0.68rem' : undefined }}
      aria-label={title}
      role={title ? 'img' : undefined}
    >
      <span aria-hidden={title ? 'true' : undefined}>{children}</span>
    </span>
  );
}
