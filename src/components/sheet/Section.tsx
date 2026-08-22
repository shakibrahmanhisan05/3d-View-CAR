/**
 * The section block — the structural unit of the auction sheet.
 *
 * Every page below the frame is built from these, so this file sets the vertical rhythm, the
 * gutter code treatment and the scroll-entry motion for essentially the whole site at once.
 *
 * WHAT SURVIVED the restyle from the flat "Sheet" design: the left gutter carrying a mono
 * code and a Bangla label. It is genuinely good information design and it is the one thing
 * that still makes the page read as an inspection record rather than a template.
 *
 * WHAT REVISION 2 ADDED: every heading is now `overline` + `display display-lit`, in that
 * order — no h2 on the site is bare text any more (§5). The overline sits on the editorial
 * layer, so it moves with the vehicle's paint; the code in the gutter stays with it. And
 * every section carries an `id` so the left pip rail has something to observe and jump to.
 */

import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

export function Section({
  code,
  label,
  title,
  sub,
  children,
  tone = 'paper',
  bleed = false,
  id,
  className,
}: {
  code: string;
  label: string;
  title?: string;
  sub?: string;
  children: ReactNode;
  /** `sunk` lifts a band slightly off the floor; `bay` is the dark 3D recess. */
  tone?: 'paper' | 'sunk' | 'bay';
  /** Full-bleed sections drop the max-width container — used for the 3D bay. */
  bleed?: boolean;
  id?: string;
  className?: string;
}) {
  const toneClass = tone === 'bay' ? 'bay' : tone === 'sunk' ? 'bg-paper-sunk' : 'bg-paper';

  return (
    <section
      id={id}
      /* The sticky header is 68px; without this a pip jump lands the heading under it. */
      className={cn('relative scroll-mt-header border-t border-glass-border', toneClass, className)}
    >
      <div className={bleed ? '' : 'mx-auto max-w-page px-4 sm:px-6'}>
        <div className="grid gap-x-10 py-16 sm:py-20 lg:grid-cols-[var(--ph-gutter)_minmax(0,1fr)]">
          {/*
            The gutter carries the CODE only. The label moved to the overline above the h2,
            where §5 wants it — printing it in both places put the same word twice on one
            screen, which is how a page starts reading as a template.
          */}
          <Reveal className="mb-5 min-w-0 lg:mb-0">
            <span className="sheet-code sheet-code-accent">{code}</span>
          </Reveal>

          {/*
            `min-w-0` is load-bearing. A grid item defaults to `min-width: auto`, so its
            min-content width propagates outward — and the demo panel contains a 380px option
            column and several horizontally-scrolling rows whose combined min-content is far
            wider than a phone. Without this the whole PAGE scrolled sideways by 212px on a
            380px viewport, and the section that caused it was three sections further up.
            Every child that needs to overflow already has its own scroll container.
          */}
          <div className="min-w-0">
            {title ? (
              <Reveal>
                <div className="min-w-0">
                  <span className="overline mb-3">{label}</span>
                  <h2 className="display display-lit max-w-3xl text-3xl font-700 sm:text-[2.6rem]">{title}</h2>
                </div>
              </Reveal>
            ) : null}
            {sub ? (
              <Reveal delay={0.06}>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">{sub}</p>
              </Reveal>
            ) : null}
            <div className={title || sub ? 'mt-12' : ''}>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A hairline-ruled key/value row. Specs, prices, ROI output — anything tabular. */
export function DataRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    /*
      A ternary, not a base plus an override. `cn()` no longer runs tailwind-merge, so
      `border-b` and `border-b-0` in the same list would be resolved by stylesheet order
      rather than by which one was written last. Emit one or the other, never both.
    */
    <div
      className={cn(
        'flex items-baseline justify-between gap-6',
        emphasis
          ? 'mt-1 border-t border-t-glass-border-lit pt-4 text-lg font-600'
          : 'border-b border-rule-faint py-2.5',
      )}
    >
      <span className={emphasis ? '' : 'text-sm text-ink-soft'}>{label}</span>
      <span className={cn('num shrink-0', emphasis && 'text-paint')}>{value}</span>
    </div>
  );
}
