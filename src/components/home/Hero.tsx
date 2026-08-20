'use client';

/**
 * Hero (§4.1) — the demo IS the hero.
 *
 * Above the fold, mobile included: a live vehicle with the paint-chip strip visible and
 * tappable within two seconds, and a two-state `গাড়ি / মোটরসাইকেল` toggle.
 *
 * That toggle does the most important job on the page. It tells a bike dealer AND a car
 * dealer, within one second, that we serve them both — which is the whole reason §4.1 puts
 * it on the hero rather than in a nav menu.
 *
 * NO HERO COPY ABOVE THE CANVAS ON MOBILE. The vehicle is the headline; the words come after.
 *
 * The bay now runs full-bleed under the transparent header and fades into the page at its
 * bottom edge, so the vehicle sits in the room rather than in a framed box.
 */

import { m, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { PosterFallback } from '@/components/configurator/PosterFallback';
import { Button } from '@/components/ui/button';
import { defaultSelection, toggleOption } from '@/lib/configurator/selection';
import { formatDelta, localePath } from '@/lib/i18n/config';
import type { EnvironmentPreset, Selection, Vehicle } from '@/lib/types';
import { cn } from '@/lib/utils';

const Scene = dynamic(() => import('@/components/configurator/Scene'), { ssr: false, loading: () => null });

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const paintHex =
    paintGroup?.options.find((option) => option.id === selection[paintGroup.id]?.[0])?.swatchHex ?? '#3A3F42';

  return (
    <section aria-label={dict.hero.label}>
      {/*
        -mt-[var(--ph-header-h)] pulls the bay up under the sticky header. The header is
        transparent until the page scrolls, so the canvas reads as full-bleed on load.
      */}
      <div className="bay bay-lit canvas-host relative -mt-header h-[76vh] min-h-[440px] pt-header sm:h-[80vh]">
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
          onReady={() => setReady(true)}
          onDowngrade={() => setQuality('low')}
        />

        <PosterFallback
          segment={vehicle.segment}
          paintHex={paintHex}
          backgroundHex={environment?.background ?? '#070809'}
          visible={!ready}
          alt={`${t(vehicle.name)} — ${dict.hero.canvasAlt}`}
          posterUrl={vehicle.asset.posterUrl}
        />

        {/* Bottom fade — the floor dissolving into the page rather than ending on a rule. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-b from-transparent to-paper"
        />

        {/* Segment toggle — the single most important control above the fold. */}
        <div
          role="radiogroup"
          aria-label={dict.roi.segment}
          className="absolute left-4 top-[calc(var(--ph-header-h)+1rem)] z-20 flex gap-1 rounded-xl border border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_70%,transparent)] p-1 backdrop-blur-md sm:left-6"
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
                'tap relative rounded-lg px-4 text-sm font-600 transition-colors duration-200',
                segment === value ? 'text-paper' : 'text-bay-ink/70 hover:text-bay-ink',
              )}
            >
              {segment === value ? (
                <m.span
                  layoutId={reduced ? undefined : 'ph-hero-segment'}
                  className="absolute inset-0 -z-10 rounded-lg bg-ink shadow-elev"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              ) : null}
              {label}
            </button>
          ))}
        </div>

        <p className="sheet-code absolute right-4 top-[calc(var(--ph-header-h)+1.5rem)] z-20 text-bay-alu sm:right-6">
          {ready ? dict.hero.dragHint : dict.common.loading}
        </p>

        {/* §16: an accessible text alternative describing the vehicle and its configuration. */}
        <p className="sr-only" aria-live="polite">
          {t(vehicle.name)}. {dict.hero.canvasAlt}
        </p>

        {/* The paint-chip strip, on the bay, tappable immediately. */}
        {paintGroup ? (
          <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-5 sm:px-6">
            <ul className="no-scrollbar mx-auto flex max-w-page snap-x gap-2.5 overflow-x-auto">
              {paintGroup.options.map((option) => {
                const active = selection[paintGroup.id]?.includes(option.id) ?? false;
                return (
                  <li key={option.id} className="snap-start">
                    <button
                      type="button"
                      onClick={() => setSelection((current) => toggleOption(current, paintGroup, option.id))}
                      aria-pressed={active}
                      className={cn(
                        'tap group relative flex w-[5.25rem] flex-col items-start gap-1.5 rounded-xl border p-1.5 text-left',
                        'bg-[color-mix(in_oklab,var(--ph-bay)_65%,transparent)] backdrop-blur-md',
                        'transition-all duration-300 ease-out',
                        active
                          ? '-translate-y-1 border-[color-mix(in_oklab,var(--ph-accent)_60%,transparent)] shadow-glow-gold'
                          : 'border-glass-border hover:-translate-y-0.5 hover:border-[var(--ph-glass-border-lit)]',
                      )}
                    >
                      <span
                        className="block h-8 w-full rounded-lg ring-1 ring-inset ring-black/40"
                        style={{ background: option.swatchHex ?? '#888' }}
                        aria-hidden="true"
                      />
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-accent-gold text-[9px] font-700 text-paper"
                        >
                          ✓
                        </span>
                      ) : null}
                      <span className="block text-[0.55rem] uppercase leading-tight tracking-wider text-bay-alu">
                        {t(option.label)}
                      </span>
                      <span
                        className={cn(
                          'num block text-[0.6rem]',
                          active ? 'text-accent-gold' : 'text-bay-alu',
                        )}
                      >
                        {formatDelta(option.priceDeltaBDT)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Copy sits BELOW the canvas, per §4.1. */}
      <div className="mx-auto max-w-page px-4 pb-16 pt-4 sm:px-6 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[var(--ph-gutter)_minmax(0,1fr)] lg:gap-x-10">
          <m.span
            className="sheet-code sheet-code-accent"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {dict.hero.code}
          </m.span>

          <div>
            <m.h1
              className="display display-lit max-w-4xl text-[2.25rem] font-700 leading-[1.05] sm:text-6xl"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
            >
              {dict.hero.title}
            </m.h1>

            <m.p
              className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg"
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.14 }}
            >
              {dict.hero.sub}
            </m.p>

            <m.div
              className="mt-9 flex flex-wrap gap-3"
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.22 }}
            >
              <Button asChild variant="primary" size="lg">
                <Link href={localePath(locale, '/contact')}>{dict.hero.ctaPrimary}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={localePath(locale, '/contact')}>{dict.hero.ctaSecondary}</Link>
              </Button>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
