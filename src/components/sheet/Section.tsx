/**
 * The section block — the structural unit of the site.
 *
 * Every page is built from these, so this file sets the vertical rhythm, the gutter code
 * treatment and the scroll-entry motion for essentially the whole site at once.
 *
 * What survived the restyle from the flat "Sheet" design: the left gutter carrying a mono
 * code and a Bangla label. It is genuinely good information design and it is the one thing
 * that still makes the page read as an inspection record rather than a template.
 * What changed: hierarchy now also comes from elevation and a lit top edge, headings get the
 * champagne accent on their code, and content arrives on scroll instead of being painted.
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
}) {
  const toneClass = tone === 'bay' ? 'bay' : tone === 'sunk' ? 'bg-paper-sunk' : 'bg-paper';

  return (
    <section
      id={id}
      className={cn('relative border-t border-glass-border', toneClass)}
    >
      <div className={bleed ? '' : 'mx-auto max-w-page px-4 sm:px-6'}>
        <div className="grid gap-x-10 py-16 sm:py-20 lg:grid-cols-[var(--ph-gutter)_minmax(0,1fr)]">
          <Reveal className="mb-5 flex items-baseline gap-3 lg:mb-0 lg:flex-col lg:items-start lg:gap-1.5">
            <span className="sheet-code sheet-code-accent">{code}</span>
            <span className="sheet-code lg:text-ink-soft">{label}</span>
          </Reveal>

          <div>
            {title ? (
              <Reveal>
                <h2 className="display display-lit max-w-3xl text-3xl font-700 sm:text-[2.6rem]">{title}</h2>
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
    <div
      className={cn(
        'flex items-baseline justify-between gap-6 border-b border-rule-faint py-2.5',
        emphasis && 'mt-1 border-b-0 border-t border-t-glass-border-lit pt-4 text-lg font-600',
      )}
    >
      <span className={emphasis ? '' : 'text-sm text-ink-soft'}>{label}</span>
      <span className={cn('num shrink-0', emphasis && 'text-accent-gold')}>{value}</span>
    </div>
  );
}
