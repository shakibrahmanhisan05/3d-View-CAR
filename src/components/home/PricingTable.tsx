/**
 * Published pricing.
 *
 * "Dealers distrust 'contact for pricing' more than a high number." So the numbers are on the
 * page, in ৳, as ONE-TIME PROJECT PRICES. No USD, no monthly software fee (§16).
 *
 * TWO COMMERCIAL RULES SURVIVE THE RESTYLE UNTOUCHED: no tier is colour-promoted over the
 * others, and there is no "most popular" badge. A highlighted middle tier is the SaaS
 * pricing-page tell, and SaaS is exactly what this market will not buy.
 *
 * REVISION 2 signals the product LADDER through SIZE instead — 40% / 32% / 28% of the row,
 * with the price figure stepping 3rem → 2.5rem → 2.25rem. The ladder is now legible from
 * across a room without a single word of promotion, and the badge rule is still intact.
 *
 * Each tier code also carries a 6px champagne square on the same baseline as its letters, so
 * `P1` `P2` `P3` read as CHIPS ON A CARD — tying the price list back to the paint-chip strip
 * that is the site's signature object.
 */

import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Card } from '@/components/ui/card';
import type { Locale } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { formatBDT } from '@/lib/i18n/config';
import { PRICING } from '@/lib/site';

export function PricingTable({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const p = dict.pricingSection;

  const tiers = [
    {
      code: 'P1',
      name: p.p1Name,
      for: p.p1For,
      body: p.p1Body,
      items: p.p1Items,
      price: formatBDT(PRICING.showroomSite.from),
      range: `${formatBDT(PRICING.showroomSite.from, false)} – ${formatBDT(PRICING.showroomSite.to, false)}`,
      unit: dict.common.oneTime,
      /* The ladder, in width and in type size. Nothing here is a colour decision. */
      figure: 'text-[3rem]',
    },
    {
      code: 'P2',
      name: p.p2Name,
      for: p.p2For,
      body: p.p2Body,
      items: p.p2Items,
      price: formatBDT(PRICING.configurator.from),
      range: `${formatBDT(PRICING.configurator.from, false)} – ${formatBDT(PRICING.configurator.to, false)}`,
      unit: p.perModel,
      figure: 'text-[2.5rem]',
    },
    {
      code: 'P3',
      name: p.p3Name,
      for: p.p3For,
      body: p.p3Body,
      items: p.p3Items,
      price: formatBDT(PRICING.capture360.from),
      range: `${formatBDT(PRICING.capture360.from, false)} – ${formatBDT(PRICING.capture360.to, false)}`,
      unit: p.perVehicle,
      figure: 'text-[2.25rem]',
    },
  ];

  return (
    <div>
      {/* On mobile they stack full-width in the same order; the ladder is a desktop reading. */}
      <RevealGroup className="grid gap-4 lg:grid-cols-[40fr_32fr_28fr]">
        {tiers.map((tier) => (
          <RevealItem key={tier.code}>
            <Card interactive className="flex h-full flex-col p-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="sheet-code sheet-code-accent flex items-baseline gap-2">
                  {/* The chip. A real 6px champagne square, on the letters' own baseline. */}
                  <span
                    aria-hidden="true"
                    className="inline-block size-1.5 shrink-0 bg-accent-gold"
                    style={{ transform: 'translateY(-1px)' }}
                  />
                  {tier.code}
                </span>
                <span className="sheet-code">{tier.unit}</span>
              </div>

              <h3 className="display mt-5 text-xl font-700">{tier.name}</h3>
              <p className="sheet-code mt-2">{tier.for}</p>

              <div className="mt-6">
                <p className="text-xs text-ink-soft">{p.from}</p>
                <p className={`num mt-1 font-700 leading-none text-ink ${tier.figure}`}>{tier.price}</p>
                <p className="num mt-2 text-xs text-alu">{tier.range}</p>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-ink-soft">{tier.body}</p>

              <div className="mt-6 border-t border-rule-faint pt-5">
                <p className="sheet-code mb-3">{p.includes}</p>
                <ul className="space-y-2">
                  {tier.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-snug">
                      <span aria-hidden="true" className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-accent-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>

      {/*
        The care plan is quoted ANNUALLY and marked optional. §16 forbids monthly SaaS
        pricing, and a "৳1,500/month" line beside project prices reads as exactly that even
        though it is maintenance. Same money, correct framing.

        It is a PLATE with a 2px top rule rather than a glass card, which ties it visually to
        the ROI ledger — same document, different row.
      */}
      <Reveal>
        <Card
          tone="plate"
          className="mt-4 flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTopWidth: 2, borderTopColor: 'color-mix(in oklab, var(--ph-accent) 45%, transparent)' }}
        >
          <div className="max-w-2xl">
            <span className="sheet-code sheet-code-accent flex items-baseline gap-2">
              <span aria-hidden="true" className="inline-block size-1.5 shrink-0 bg-accent-gold" />
              P4
            </span>
            <h3 className="display mt-3 text-xl font-700">{p.careName}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.careBody}</p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="num text-2xl font-700 leading-none text-ink">{formatBDT(PRICING.carePlanYearly)}</p>
            <p className="sheet-code mt-2">
              {p.perYear} · {dict.common.optional}
            </p>
          </div>
        </Card>
      </Reveal>

      <div className="mt-8 flex flex-col gap-2 text-sm text-ink-soft">
        <p>{p.oneTimeNote}</p>
        <p>{p.advanceNote}</p>
      </div>
    </div>
  );
}
