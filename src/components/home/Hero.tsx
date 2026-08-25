'use client';

/**
 * Hero — the vehicle on a lit stage, and nothing else competing with it.
 *
 * The composition is deliberately spare now:
 *
 *   stage (dark, rounded)  →  monolith watermark · transparent 3D canvas · floor streak
 *                          →  segment toggle (top-left) · price stat (bottom-left)
 *                          →  paint chips (the signature, along the bottom edge)
 *   page (light paper)     →  headline · subline · the one CTA that matters
 *
 * The move from dark stage to bright page IS the design: daylight for words, spotlight
 * for the car. Three depth planes survive — watermark behind, canvas above it, chrome
 * over both — but every panel that used to sit between the visitor and the vehicle is
 * gone. The title lives below the frame on every viewport: the car is the headline.
 */

import { m, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BootScreen } from '@/components/boot/BootScreen';
import { useApplyPaintTint } from '@/components/brand/usePaintTint';
import { Frame, type PipItem } from '@/components/frame/Frame';
import { StageFloor } from '@/components/frame/StageFloor';
import { Arrow, Stat } from '@/components/frame/StageChrome';
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { PosterFallback } from '@/components/configurator/PosterFallback';
import { Button } from '@/components/ui/button';
import { defaultSelection, toggleOption } from '@/lib/configurator/selection';
import { formatBDT, formatDelta, localePath } from '@/lib/i18n/config';
import type { EnvironmentPreset, Selection, Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';

const Scene = dynamic(() => import('@/components/configurator/Scene'), { ssr: false, loading: () => null });

const EASE = [0.16, 1, 0.3, 1] as const;

/** The eight homepage sections the left pip rail walks. IDs match <SiteExperience>. */
const SECTION_IDS = ['hero', 'problems', 'demos', 'products', 'roi', 'case', 'pricing', 'faq'] as const;

export function Hero({
  car,
  bike,
  initialSegment = 'car',
}: {
  car: Vehicle;
  bike: Vehicle;
  /**
   * Which segment the hero opens on. A bike showroom's own demo must not land on a car —
   * getting that wrong in the first second of a meeting undoes the point of the visit (§10).
   */
  initialSegment?: 'car' | 'bike';
}) {
  const dict = useDict();
  const locale = useLocale();
  const t = useLocalized();
  const reduced = useReducedMotion();

  const [segment, setSegment] = useState<'car' | 'bike'>(initialSegment);
  const [ready, setReady] = useState(false);
  const [reducedState, setReducedState] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>('high');

  const vehicle = segment === 'car' ? car : bike;
  const paintGroup = useMemo(() => vehicle.optionGroups.find((group) => group.id === 'paint'), [vehicle]);

  const [selection, setSelection] = useState<Selection>(() => defaultSelection(vehicle.optionGroups));

  // Swap the vehicle in place: same canvas, new data, poster back on top for the dissolve.
  const [renderedId, setRenderedId] = useState(vehicle.id);
  if (renderedId !== vehicle.id) {
    setRenderedId(vehicle.id);
    setSelection(defaultSelection(vehicle.optionGroups));
    setReady(false);
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedState(query.matches);
    const listener = (event: MediaQueryListEvent) => setReducedState(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  const environment: EnvironmentPreset | undefined = vehicle.environments[0];
  const paint = paintGroup?.options.find((option) => option.id === selection[paintGroup.id]?.[0]);
  const paintHex = paint?.swatchHex ?? '#3A3F42';

  /*
   * THE EDITORIAL TINT.
   *
   * The watermark, the overlines and the section accents re-derive from the paint the
   * visitor just tapped. Two custom properties on <html> per change — light-ground ink
   * and stage-ground ink — so text stays readable whichever surface it sits on.
   */
  useApplyPaintTint(paintHex);

  const pips: PipItem[] = useMemo(
    () =>
      SECTION_IDS.map((id) => ({
        id,
        label:
          id === 'hero'
            ? dict.scroll.hero
            : id === 'problems'
              ? dict.scroll.problem
              : id === 'demos'
                ? dict.scroll.demos
                : id === 'products'
                  ? dict.scroll.products
                  : id === 'roi'
                    ? dict.scroll.maths
                    : id === 'case'
                      ? dict.scroll.case
                      : id === 'pricing'
                        ? dict.scroll.pricing
                        : dict.scroll.faq,
      })),
    [dict.scroll],
  );

  /** A bike's second fact is its seat height; a car's is the paint's real name. */
  const secondStat =
    vehicle.segment === 'motorcycle' && vehicle.seatHeightMm
      ? { figure: String(vehicle.seatHeightMm), unit: 'mm', label: dict.hero.statSeat, kind: 'figure' as const }
      : { figure: paint ? t(paint.label) : '—', unit: undefined, label: dict.hero.statPaint, kind: 'name' as const };

  return (
    <section id="hero" aria-label={dict.hero.label} className="scroll-mt-header">
      <BootScreen
        modelUrl={vehicle.asset.glbUrl}
        segment={vehicle.segment}
        paintHex={paintHex}
        wordmark={dict.common.brandLatin}
        sceneReady={ready}
      />

      {/* The header is opaque paper now, so the stage starts below it — no pull-under. */}
      <div className="px-3 pt-3 sm:px-5">
        <Frame
          letterbox
          pips={pips}
          shellClassName="bay bay-lit canvas-host"
          shellStyle={{
            height:
              'min(max(560px, calc(100dvh - var(--ph-header-h) - 2 * var(--ph-frame-inset))), calc(100dvh - var(--ph-header-h)))',
          }}
        >
          {/* z-1: Transparent 3D canvas — the StagePlatform mesh is the floor and backdrop */}
          <div className="absolute inset-0 z-[1]">
            <Scene
              vehicle={vehicle}
              selection={selection}
              environment={environment ?? vehicle.environments[0]!}
              mode="exterior"
              quality={quality}
              resetSignal={0}
              reducedMotion={reducedState}
              showHotspots={false}
              allowZoom={false}
              transparentBg
              onReady={() => setReady(true)}
              onDowngrade={() => setQuality('low')}
            />

            <PosterFallback
              segment={vehicle.segment}
              paintHex={paintHex}
              backgroundHex={environment?.background ?? '#101114'}
              visible={!ready}
              transparent
              alt={`${t(vehicle.name)} — ${dict.hero.canvasAlt}`}
              posterUrl={vehicle.asset.posterUrl}
            />
          </div>

          <StageFloor />

          {/* --- Chrome ------------------------------------------------------ */}

          {/* Top-left: segment toggle — the most important control on the page. */}
          <div
            role="radiogroup"
            aria-label={dict.roi.segment}
            className="absolute left-[var(--ph-frame-inset)] top-[calc(var(--ph-frame-inset)+0.25rem)] z-20 flex gap-1 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-md"
          >
            {(
              [
                ['car', dict.hero.segmentCar],
                ['bike', dict.hero.segmentBike],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={segment === value}
                onClick={() => setSegment(value)}
                className={cn(
                  'tap relative rounded-full px-4 text-sm font-600 transition-colors duration-200',
                  segment === value ? 'text-bay' : 'text-bay-ink/70 hover:text-bay-ink',
                )}
              >
                {segment === value ? (
                  <m.span
                    layoutId={reduced ? undefined : 'ph-hero-segment'}
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-elev"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                ) : null}
                {label}
              </button>
            ))}
          </div>

          {/* Top-right: state, quiet. */}
          <p className="sheet-code absolute right-[var(--ph-frame-inset)] top-[calc(var(--ph-frame-inset)+1rem)] z-20 text-bay-alu">
            {ready ? dict.hero.dragHint : dict.common.loading}
          </p>

          <p className="sr-only" aria-live="polite">
            {t(vehicle.name)}. {dict.hero.canvasAlt}
          </p>

          {/* Bottom-left: two naked facts on the stage floor. */}
          <div className="pointer-events-none absolute bottom-[9.5rem] left-[var(--ph-frame-inset)] z-20 sm:bottom-[10rem]">
            <Stat
              figure={formatBDT(vehicle.basePriceBDT, false)}
              unit="৳"
              label={dict.hero.statMrp}
            />
            <div className="mt-5">
              <Stat
                figure={secondStat.figure}
                unit={secondStat.unit}
                label={secondStat.label}
                kind={secondStat.kind}
                tinted
              />
            </div>
          </div>

          {/* Bottom-right: one affordance into the configurator. */}
          <Link
            href={localePath(locale, segment === 'car' ? '/demo/car' : '/demo/bike')}
            className="tap absolute bottom-[9.75rem] right-[var(--ph-frame-inset)] z-20 hidden items-center gap-2 rounded-full border border-white/15 bg-black/35 px-5 py-2 text-sm font-600 text-bay-ink backdrop-blur-md transition-colors duration-200 hover:border-white/40 sm:inline-flex"
          >
            {dict.hero.exploreCta}
            <Arrow />
          </Link>

          {/* Signature Paint Chip Strip */}
          {paintGroup ? (
            <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-4 sm:px-6 sm:pb-5">
              <ul className="no-scrollbar edge-fade mx-auto flex max-w-page snap-x gap-2 overflow-x-auto px-1 py-2">
                {paintGroup.options.map((option) => {
                  const active = selection[paintGroup.id]?.includes(option.id) ?? false;
                  return (
                    <li key={option.id} className="snap-start">
                      <button
                        type="button"
                        onClick={() => setSelection((current) => toggleOption(current, paintGroup, option.id))}
                        aria-pressed={active}
                        className={cn(
                          'tap group relative flex w-[6.5rem] flex-col items-start gap-1 rounded-xl border p-1.5 text-left backdrop-blur-md',
                          'transition-[transform,border-color,background-color] duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                          active
                            ? '-translate-y-1 border-white/45 bg-white/[0.07]'
                            : 'border-white/10 bg-black/30 hover:-translate-y-0.5 hover:border-white/25',
                        )}
                      >
                        <span
                          className="block h-11 w-full rounded-lg ring-1 ring-inset ring-black/30"
                          style={{ background: option.swatchHex ?? '#888' }}
                          aria-hidden="true"
                        />

                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-white"
                          >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                              <path d="M1.5 5.5 4 8l4.5-6" stroke="#17181a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        ) : null}

                        <span className="block truncate text-[0.68rem] uppercase leading-tight tracking-[0.05em] text-bay-ink/85">
                          {t(option.label)}
                        </span>
                        <span className={cn('num block text-[0.72rem]', active ? 'text-paint' : 'text-bay-alu')}>
                          {formatDelta(option.priceDeltaBDT)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </Frame>
      </div>

      {/* --- Words on daylight --------------------------------------------- */}
      <div className="mx-auto max-w-page px-4 pb-16 pt-12 sm:px-6 sm:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <m.div
            className="lg:col-span-7"
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
          >
            <h1 className="display display-lit max-w-3xl text-[2.35rem] font-700 leading-[1.06] sm:text-6xl">
              {dict.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{dict.hero.sub}</p>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Button asChild variant="primary" size="lg">
                <Link href={localePath(locale, '/contact')}>{dict.hero.ctaPrimary}</Link>
              </Button>
              <Link
                href={localePath(locale, '/contact')}
                className="tap inline-flex items-center gap-1.5 text-sm font-600 text-ink underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-signal hover:decoration-signal"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </div>
          </m.div>

          {/* The quiet column: what this actually is, in one breath each. */}
          <m.div
            className="lg:col-span-5"
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          >
            <dl className="divide-y divide-rule-faint border-y border-rule-faint">
              {[
                { term: dict.hero.factOneLabel, desc: dict.hero.factOneBody },
                { term: dict.hero.factTwoLabel, desc: dict.hero.factTwoBody },
              ].map((fact) => (
                <div key={fact.term} className="py-5">
                  <dt className="sheet-code mb-1.5">{fact.term}</dt>
                  <dd className="text-[0.95rem] leading-relaxed text-ink-soft">{fact.desc}</dd>
                </div>
              ))}
            </dl>
          </m.div>
        </div>
      </div>
    </section>
  );
}
