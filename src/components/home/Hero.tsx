'use client';

/**
 * Hero — the demo IS the hero, and the hero is now a COMPOSITION rather than a canvas.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * The old hero was a 3D model floating in a flat dark rectangle with a chip strip laid over
 * it. It worked and it did not sell: there was no set around the vehicle, so nothing on
 * screen said "this is a showroom", and every element on it was the same visual weight.
 *
 * The rebuild puts the vehicle inside a cinema <Frame> and hangs four objects in its corners,
 * exactly as the reference composition does:
 *
 *   backdrop  →  the plume, painted by body::before
 *   z-0       →  <Monolith>     the model code, giant, in the CAR'S OWN COLOUR
 *   z-1       →  <Scene>        TRANSPARENT canvas, so the roofline occludes the letterforms
 *   z-2       →  <StageFloor>   the ground streak and horizon the tyres sit on
 *   z-4       →  the letterbox
 *   z-20      →  segment toggle · drag hint · stat pair · model plate · explore card · chips
 *
 * Three genuine depth planes is the whole difference between 3D on a page and 3D inside a
 * scene, and it costs one CSS layer and one `alpha: true`.
 *
 * The title, the sub and the single primary CTA live BELOW the frame on every viewport. The
 * vehicle is the headline; the words come after (§7.2).
 */

import { m, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BootScreen } from '@/components/boot/BootScreen';
import { useApplyPaintTint } from '@/components/brand/usePaintTint';
import { Frame, type PipItem } from '@/components/frame/Frame';
import { Monolith, StageFloor } from '@/components/frame/Monolith';
import { ExploreCard, ModelPlate, Stat, StatPair } from '@/components/frame/StageChrome';
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { PosterFallback } from '@/components/configurator/PosterFallback';
import { Button } from '@/components/ui/button';
import { defaultSelection, toggleOption } from '@/lib/configurator/selection';
import { formatBDT, formatDelta, localePath } from '@/lib/i18n/config';
import { getModelCode } from '@/lib/model-code';
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
   * Every accented piece of text on the site — the monolith, the overlines, the section
   * codes, the stat figures, the fall-off in every display headline — is re-derived from the
   * paint the visitor just tapped. One layout effect, two custom properties on <html>, and
   * the whole page moves with the car. See src/lib/paint.ts for why the swatch is treated as
   * a hue source rather than as a colour.
   */
  useApplyPaintTint(paintHex);

  const modelCode = getModelCode(vehicle);

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

  /**
   * The second fact. A bike has a seat height — a real number, and the one spec a rider
   * checks first — so it gets the monumental treatment. A car's second fact is the paint's
   * manufacturer name, which is a NAME and is set as one.
   */
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
        code={modelCode}
        wordmark={dict.common.brandLatin}
        sceneReady={ready}
      />

      {/*
        -mt-header pulls the frame up under the sticky header, which is transparent until the
        page scrolls — so the composition starts at the very top of the viewport and the
        header floats inside it, exactly as the reference does.

        The height is a contract, not a guess: full viewport minus the header minus both frame
        insets, floored so the vehicle always has room. It is set on the shell rather than on
        an inner element so the box is reserved before the canvas mounts and CLS stays at 0.
      */}
      <div className="-mt-header px-4 pt-header sm:px-0">
        <Frame
          letterbox
          pips={pips}
          shellClassName="bay canvas-host"
          shellStyle={{
            /*
              Floored at 560px so a short phone still gives the vehicle room, and ceilinged at
              the viewport minus the header so the frame's bottom rim is never pushed below the
              fold — a cinema frame you cannot see the bottom of is just a dark rectangle again.
            */
            height:
              'min(max(560px, calc(100dvh - var(--ph-header-h) - 2 * var(--ph-frame-inset))), calc(100dvh - var(--ph-header-h)))',
          }}
        >
          <Monolith code={modelCode} />

          {/* z-1: the canvas. Transparent, so the vehicle occludes the monolith behind it. */}
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
              backgroundHex={environment?.background ?? '#070809'}
              visible={!ready}
              transparent
              alt={`${t(vehicle.name)} — ${dict.hero.canvasAlt}`}
              posterUrl={vehicle.asset.posterUrl}
            />
          </div>

          <StageFloor />

          {/* --- Chrome, all at z-20, all inside the frame inset ----------- */}

          {/* Top-left: Vehicle segment controls and live telemetry HUD */}
          <div className="absolute left-[var(--ph-frame-inset)] top-[calc(var(--ph-frame-inset)+0.5rem)] z-20 flex items-center gap-3">
            <div
              role="radiogroup"
              aria-label={dict.roi.segment}
              className="flex gap-1 rounded-xl border border-glass-border-lit bg-[color-mix(in_oklab,var(--ph-bay)_75%,transparent)] p-1 backdrop-blur-md shadow-elev"
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
                    'tap relative rounded-lg px-4 py-1 text-sm font-600 transition-colors duration-200',
                    segment === value ? 'text-paper font-700' : 'text-bay-ink/70 hover:text-bay-ink',
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

            {/* Telemetry Status HUD */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_60%,transparent)] px-3 py-1.5 backdrop-blur-md text-[0.7rem] font-mono tracking-wider">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-ink font-600">60 FPS</span>
              <span className="text-bay-alu/30">•</span>
              <span className="text-accent-gold font-600 tracking-widest uppercase">{ready ? 'STUDIO 3D LIVE' : 'INITIALIZING'}</span>
            </div>
          </div>

          {/* Top-right: the drag affordance with interactive badge. */}
          <div className="absolute right-[var(--ph-frame-inset)] top-[calc(var(--ph-frame-inset)+0.75rem)] z-20 flex items-center gap-2">
            <span className="sheet-code rounded-full border border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_60%,transparent)] px-2.5 py-1 text-[0.65rem] uppercase tracking-widest text-bay-alu backdrop-blur-md">
              {ready ? dict.hero.dragHint : dict.common.loading}
            </span>
          </div>

          {/* §16: an accessible text alternative describing the vehicle and its configuration. */}
          <p className="sr-only" aria-live="polite">
            {t(vehicle.name)}. {dict.hero.canvasAlt}
          </p>

          {/*
            The three bottom objects share one row so they can never collide, and the row sits
            above the chip strip. On mobile the stat pair alone survives — a 380px screen has
            room for two facts or for none, and two facts is the correct answer.
          */}
          <div className="pointer-events-none absolute inset-x-[var(--ph-frame-inset)] bottom-[10.75rem] z-20 flex items-end justify-between gap-6">
            <StatPair className="pointer-events-auto">
              <Stat
                figure={formatBDT(vehicle.basePriceBDT, false)}
                unit="৳"
                label={dict.hero.statMrp}
              />
              <Stat
                figure={secondStat.figure}
                unit={secondStat.unit}
                label={secondStat.label}
                kind={secondStat.kind}
                tinted
              />
            </StatPair>

            {/*
              Responsive visibility lives on WRAPPERS, never on the components themselves.
              Both set `display` in their own base class list, and without tailwind-merge a
              `hidden` arriving through `className` is resolved by stylesheet order rather
              than by intent (see src/lib/utils.ts). Hiding a wrapper cannot conflict.
            */}
            <div className="pointer-events-auto hidden flex-1 lg:block">
              <ModelPlate code={modelCode} sub={dict.hero.modelPlateSub} />
            </div>

            <div className="pointer-events-auto hidden sm:block">
              <ExploreCard
                href={localePath(locale, segment === 'car' ? '/demo/car' : '/demo/bike')}
                label={dict.hero.exploreCta}
                angleLabel={dict.hero.exploreAngle}
                segment={vehicle.segment}
                paintHex={paintHex}
                posterUrl={vehicle.asset.posterUrl}
              />
            </div>
          </div>

          {/* The signature object: the paint-chip strip, floating on the frame's bottom bleed. */}
          {paintGroup ? (
            <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-5 sm:px-6">
              <ul className="no-scrollbar edge-fade mx-auto flex max-w-page snap-x gap-2.5 overflow-x-auto px-1 py-2">
                {paintGroup.options.map((option) => {
                  const active = selection[paintGroup.id]?.includes(option.id) ?? false;
                  return (
                    <li key={option.id} className="snap-start">
                      <button
                        type="button"
                        onClick={() => setSelection((current) => toggleOption(current, paintGroup, option.id))}
                        aria-pressed={active}
                        className={cn(
                          'tap group relative flex w-[6.75rem] flex-col items-start gap-1.5 rounded-xl border p-1.5 text-left',
                          /*
                            60% bay rather than glass: the chips must read as sitting ON THE
                            FLOOR of the bay, not as another sheet of chrome laid over it.
                          */
                          'bg-[color-mix(in_oklab,var(--ph-bay)_60%,transparent)] backdrop-blur-md',
                          /*
                            320ms, heavier than the 260ms nav/tab pill. The strip is the site's
                            memorable object and it must not move like a menu item (§13).
                          */
                          'transition-[transform,border-color,box-shadow,filter] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                          active
                            ? '-translate-y-1.5 border-[color-mix(in_oklab,var(--ph-accent)_60%,transparent)]'
                            : 'border-glass-border hover:-translate-y-0.5 hover:border-[var(--ph-glass-border-lit)]',
                        )}
                        style={
                          active
                            ? {
                                filter:
                                  'drop-shadow(0 10px 20px color-mix(in oklab, var(--ph-signal) 30%, transparent))',
                              }
                            : undefined
                        }
                      >
                        {/* The champagne rule along the top edge of the selected chip. */}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-px"
                            style={{
                              background:
                                'linear-gradient(90deg, transparent, var(--ph-accent) 24%, var(--ph-accent) 76%, transparent)',
                            }}
                          />
                        ) : null}

                        <span
                          className="block h-[3.25rem] w-full rounded-lg ring-1 ring-inset ring-black/40"
                          style={{ background: option.swatchHex ?? '#888' }}
                          aria-hidden="true"
                        />

                        {/*
                          The inkan stamp: an ember disc on a champagne outer ring. The old
                          bare tick read as a checkbox; this reads as a seal pressed into the
                          corner of the chip, which is the auction-sheet language of the site.
                        */}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full border"
                            style={{ borderColor: 'var(--ph-accent)', background: 'var(--ph-bay)' }}
                          >
                            <span className="block size-1.5 rounded-full" style={{ background: 'var(--ph-signal)' }} />
                          </span>
                        ) : null}

                        <span className="block text-[0.7rem] uppercase leading-tight tracking-[0.06em] text-ink-soft">
                          {t(option.label)}
                        </span>
                        <span className={cn('num block text-[0.75rem]', active ? 'text-paint' : 'text-bay-alu')}>
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

      {/* --- Copy, below the frame, on every viewport (§7.2) ---------------- */}
      <div className="mx-auto max-w-page px-4 pb-16 pt-12 sm:px-6 sm:pb-20">
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
            {/* 720ms / 24px, staggered 80ms — slower than a section reveal. The hero earns it. */}
            <m.h1
              className="display display-lit max-w-4xl text-[2.25rem] font-700 leading-[1.05] sm:text-6xl"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: EASE, delay: 0.05 }}
            >
              {dict.hero.title}
            </m.h1>

            <m.p
              className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: EASE, delay: 0.13 }}
            >
              {dict.hero.sub}
            </m.p>

            {/*
              ONE button, not two. Two visually equal buttons steal from the WhatsApp CTA in
              the header, and the secondary action is a booking link, not a second offer (§7.2).
            */}
            <m.div
              className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, ease: EASE, delay: 0.21 }}
            >
              <Button asChild variant="primary" size="lg">
                <Link href={localePath(locale, '/contact')}>{dict.hero.ctaPrimary}</Link>
              </Button>
              <Link
                href={localePath(locale, '/contact')}
                className="tap inline-flex items-center text-sm font-600 text-ink-soft underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-paint hover:decoration-[var(--ph-paint-lit)]"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
