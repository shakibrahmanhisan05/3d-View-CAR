'use client';

/**
 * ROI calculator (§9).
 *
 * This is used LIVE, in a meeting, while the owner watches — Tasfia asks him his walk-ins and
 * his average sale, types them in, and lets the arithmetic make the argument.
 *
 * THE NUMBERS ARE DELIBERATELY CONSERVATIVE. A 15% lift in qualified leads, nothing else
 * changed. Foreign vendors quote 40%+; quoting that to a man who has run a showroom for
 * twenty years destroys the meeting. §9: a calculator that visibly under-claims wins the
 * room; one that overclaims loses it. The assumption is printed under the result, on purpose.
 */

import { m, useReducedMotion } from 'motion/react';
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fill } from '@/lib/i18n';
import { formatBDT } from '@/lib/i18n/config';
import { PRICING, ROI_DEFAULTS } from '@/lib/site';

type Segment = 'car' | 'bike';

const LIMITS = {
  walkins: { min: 10, max: 400, step: 5 },
  carSale: { min: 300_000, max: 5_000_000, step: 50_000 },
  bikeSale: { min: 60_000, max: 800_000, step: 5_000 },
  closeRate: { min: 2, max: 60, step: 1 },
  boostSpend: { min: 0, max: 100_000, step: 1_000 },
} as const;

export function RoiCalculator({ projectCostBDT = PRICING.roiReferenceProject }: { projectCostBDT?: number }) {
  const dict = useDict();
  const reduced = useReducedMotion();

  // Explicit <number>: ROI_DEFAULTS is `as const`, so inference would pin each of these to
  // its literal default and make the sliders unmovable.
  const [segment, setSegment] = useState<Segment>('bike');
  const [walkins, setWalkins] = useState<number>(ROI_DEFAULTS.bike.walkins);
  const [avgSale, setAvgSale] = useState<number>(ROI_DEFAULTS.bike.avgSale);
  const [closeRate, setCloseRate] = useState<number>(ROI_DEFAULTS.bike.closeRate);
  const [boostSpend, setBoostSpend] = useState<number>(ROI_DEFAULTS.bike.boostSpend);

  const switchSegment = (next: Segment) => {
    setSegment(next);
    // Only the sale value is segment-specific; carrying a car's ৳12 lakh over to a bike
    // showroom would produce a number nobody in the room believes.
    setAvgSale(ROI_DEFAULTS[next].avgSale);
  };

  const result = useMemo(() => {
    const current = walkins * (closeRate / 100) * avgSale;
    const projected = current * (1 + ROI_DEFAULTS.leadLift);
    const additional = projected - current;
    const monthlyCost = projectCostBDT / 12;
    const annualBoost = boostSpend * 12;

    return {
      current,
      projected,
      additional,
      monthlyCost,
      paybackMonths: additional > 0 ? projectCostBDT / additional : null,
      boostPercent: annualBoost > 0 ? Math.round((projectCostBDT / annualBoost) * 100) : null,
    };
  }, [walkins, closeRate, avgSale, boostSpend, projectCostBDT]);

  const saleLimits = segment === 'car' ? LIMITS.carSale : LIMITS.bikeSale;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* --- Inputs --------------------------------------------------------- */}
      <div>
        <fieldset className="mb-6">
          <legend className="sheet-code mb-2">{dict.roi.segment}</legend>
          <div className="flex gap-1 rounded-xl border border-glass-border bg-glass p-1">
            {(['car', 'bike'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={segment === value}
                onClick={() => switchSegment(value)}
                className={cn(
                  'tap relative flex-1 rounded-lg px-4 text-sm font-600 transition-colors duration-200',
                  segment === value ? 'text-paper' : 'text-ink-soft hover:text-ink',
                )}
              >
                {segment === value ? (
                  <m.span
                    layoutId={reduced ? undefined : 'ph-roi-segment'}
                    className="absolute inset-0 -z-10 rounded-lg bg-ink shadow-elev-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                ) : null}
                {value === 'car' ? dict.roi.segmentCar : dict.roi.segmentBike}
              </button>
            ))}
          </div>
        </fieldset>

        <Slider
          label={dict.roi.walkins}
          value={walkins}
          onChange={setWalkins}
          format={(value) => String(value)}
          {...LIMITS.walkins}
        />
        <Slider
          label={dict.roi.avgSale}
          value={avgSale}
          onChange={setAvgSale}
          format={(value) => formatBDT(value)}
          {...saleLimits}
        />
        <Slider
          label={dict.roi.closeRate}
          value={closeRate}
          onChange={setCloseRate}
          format={(value) => `${value}%`}
          {...LIMITS.closeRate}
        />
        <Slider
          label={dict.roi.boostSpend}
          value={boostSpend}
          onChange={setBoostSpend}
          format={(value) => formatBDT(value)}
          {...LIMITS.boostSpend}
        />
      </div>

      {/* --- Output --------------------------------------------------------- */}
      <Card tone="plate" className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-plate-border px-5 py-4">
          <p className="sheet-code sheet-code-accent">{dict.roi.code}-OUT</p>
          {/*
            The section's editorial artefact: a struck seal carrying the code of the row this
            document produces. It is the same object as the auction grade on the 360° viewer
            and the FORM-A stamp on the contact envelope — one language, three sections.
          */}
          <span className="seal shrink-0" aria-hidden="true" style={{ width: 56, height: 56 }}>
            {dict.roi.code}
            <br />
            OUT
          </span>
        </div>

        <dl className="px-5 pt-4">
          <Row label={dict.roi.currentRevenue} value={formatBDT(result.current)} />
          <Row label={dict.roi.projectedRevenue} value={formatBDT(result.projected)} />
        </dl>

        <div className="mx-5 mt-5 border-t border-glass-border-lit pt-5">
          <span className="overline">{dict.roi.additional}</span>
          {/*
            The one number the whole section exists to produce — so it gets the whole section's
            weight: ember (the action layer, because this figure IS the argument), roughly
            twice its old size, and a champagne hairline ruled directly under it the way a
            total is underscored on a real invoice.
          */}
          <p
            className="num mt-3 font-700 leading-none text-signal-lit"
            style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}
            aria-live="polite"
          >
            {formatBDT(result.additional)}
          </p>
          <div
            aria-hidden="true"
            className="mt-3 h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, var(--ph-accent), color-mix(in oklab, var(--ph-accent) 20%, transparent) 60%, transparent)',
            }}
          />

          <dl className="mt-5">
            <Row label={dict.roi.amortised} value={formatBDT(result.monthlyCost)} small />
            {result.paybackMonths !== null ? (
              <Row
                label={dict.roi.payback}
                value={`${result.paybackMonths < 1 ? '< 1' : Math.ceil(result.paybackMonths)} ${dict.roi.months}`}
                small
              />
            ) : null}
          </dl>

          {result.boostPercent !== null ? (
            <p className="mt-5 border-l-2 border-accent-gold pl-4 text-sm leading-relaxed text-ink-soft">
              {fill(dict.roi.boostCompare, { percent: result.boostPercent })}
            </p>
          ) : null}
        </div>

        {/* §9: state the assumption openly beneath the result. */}
        <div className="mt-6 border-t border-glass-border bg-glass px-5 py-4">
          <p className="sheet-code mb-2">{dict.roi.assumptionTitle}</p>
          <p className="text-xs leading-relaxed text-ink-soft">{dict.roi.assumption}</p>
          <p className="mt-2 text-xs text-alu">{dict.roi.disclaimer}</p>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule-faint py-2 last:border-b-0">
      <dt className={small ? 'text-xs text-ink-soft' : 'text-sm text-ink-soft'}>{label}</dt>
      <dd className={`num shrink-0 ${small ? 'text-xs' : 'text-base'}`}>{value}</dd>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  format,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  min: number;
  max: number;
  step: number;
}) {
  const id = useId();

  return (
    <div className="border-b border-rule-faint py-3.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm text-ink-soft">
          {label}
        </label>
        <output htmlFor={id} className="num text-base font-600 text-ink">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="slider mt-1"
        /* The champagne run to the thumb. See globals.css — one custom property, no JS loop. */
        style={{ '--ph-slider-fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
