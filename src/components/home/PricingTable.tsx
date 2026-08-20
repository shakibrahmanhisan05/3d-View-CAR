/**
 * Published pricing (§4.7).
 *
 * "Dealers distrust 'contact for pricing' more than a high number." So the numbers are on the
 * page, in ৳, as ONE-TIME PROJECT PRICES. No USD, no monthly software fee (§16).
 *
 * The tiers are now cards rather than a flat table, but two rules from the original design
 * survive deliberately, because they are commercial rather than visual: no tier is visually
 * promoted over the others, and there is no "most popular" badge. A highlighted middle tier
 * is the SaaS pricing-page tell, and SaaS is exactly what this market will not buy — the
 * numbers here are project quotes, and they are presented as equals.
 *
 * The figures themselves stay monospaced and tabular, so three prices of different lengths
 * still line up down the column.
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
    },
  ];

  return (
    <div>
      <RevealGroup className="grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => (
          <RevealItem key={tier.code}>
            <Card interactive className="flex h-full flex-col p-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="sheet-code sheet-code-accent">{tier.code}</span>
                <span className="sheet-code">{tier.unit}</span>
              </div>

              <h3 className="display mt-5 text-xl font-700">{tier.name}</h3>
              <p className="sheet-code mt-2">{tier.for}</p>

              <div className="mt-6">
                <p className="text-xs text-ink-soft">{p.from}</p>
                <p className="num mt-1 text-3xl font-700 leading-none text-ink">{tier.price}</p>
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
      */}
      <Reveal>
        <Card className="mt-4 flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="sheet-code sheet-code-accent">P4</span>
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
