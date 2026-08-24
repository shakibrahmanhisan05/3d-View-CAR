/**
 * The section block — the structural unit of every page.
 *
 * One rhythm site-wide: an eyebrow label over a large headline, a lede when there is one,
 * then content. Generous vertical space does what decoration used to. The old left gutter
 * carrying a mono code is gone — a code on every section read as a template, and nothing
 * about "SEC-04" helped a showroom owner decide anything.
 *
 * `min-w-0` is load-bearing (see the inner column): grid items default to min-width:auto,
 * and wide subtrees inside them were scrolling whole pages sideways on a 380px phone.
 */

import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

export function Section({
  label,
  title,
  sub,
  children,
  tone = 'paper',
  bleed = false,
  id,
  className,
  /* Deprecated: the old gutter codes. Accepted so existing call sites stay valid; not rendered. */
  code: _legacyCode,
}: {
  label: string;
  title?: string;
  sub?: string;
  children: ReactNode;
  /** `sunk` lifts a band slightly off the floor; `bay` is the dark stage. */
  tone?: 'paper' | 'sunk' | 'bay';
  /** Full-bleed sections drop the max-width container. */
  bleed?: boolean;
  id?: string;
  className?: string;
  code?: string;
}) {
  const toneClass = tone === 'bay' ? 'bay' : tone === 'sunk' ? 'bg-paper-sunk' : 'bg-paper';

  return (
    <section
      id={id}
      /* The sticky header is 64px; without this an anchor jump lands under it. */
      className={cn('relative scroll-mt-header', toneClass, className)}
    >
      <div className={bleed ? '' : 'mx-auto max-w-page px-4 sm:px-6'}>
        <div className="py-16 sm:py-24">
          <div className="min-w-0">
            {title ? (
              <Reveal>
                <div className="min-w-0">
                  <span className="overline mb-4">{label}</span>
                  <h2 className="display display-lit max-w-3xl text-[1.95rem] font-700 sm:text-[2.75rem]">
                    {title}
                  </h2>
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
      conflicting utilities in one list resolve by stylesheet order rather than intent.
      Emit one or the other, never both.
    */
    <div
      className={cn(
        'flex items-baseline justify-between gap-6',
        emphasis
          ? 'mt-1 border-t pt-4 text-lg font-600'
          : 'border-b border-rule-faint py-2.5',
      )}
    >
      <span className={emphasis ? '' : 'text-sm text-ink-soft'}>{label}</span>
      <span className={cn('num shrink-0', emphasis && 'font-700')}>{value}</span>
    </div>
  );
}
