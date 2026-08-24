'use client';

/**
 * <ConfiguratorRoot> — owns the state, touches no R3F (§5).
 *
 * The R3F tree is behind `dynamic(..., { ssr: false })` so three.js never enters the main
 * bundle (§14). Everything this component renders — the paint chips, the price, the action
 * bar — is plain DOM and is interactive before a single byte of 3D has arrived, which is
 * what makes the §5 loading sequence honest rather than aspirational.
 */

import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionBar } from './ActionBar';
import { OptionPanel } from './OptionPanel';
import { PosterFallback } from './PosterFallback';
import { PriceSummary } from './PriceSummary';
import { RiderHeightCheck } from './RiderHeightCheck';
import { SplitDivider } from './SplitDivider';
import { useBrand } from '@/components/brand/BrandProvider';
import { useApplyPaintTint } from '@/components/brand/usePaintTint';
import { BootScreen } from '@/components/boot/BootScreen';
import { Monolith, StageFloor } from '@/components/frame/Monolith';
import { Stat, StatPair } from '@/components/frame/StageChrome';
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { formatBDT } from '@/lib/i18n/config';
import { getModelCode } from '@/lib/model-code';
import type { EngineAudio } from '@/lib/configurator/engine-audio';
import { synthProfileId } from '@/lib/configurator/engine-audio';
import {
  buildWhatsAppMessage,
  decodeSelection,
  defaultSelection,
  encodeSelection,
  priceBreakdown,
  toggleOption,
} from '@/lib/configurator/selection';
import { localePath } from '@/lib/i18n/config';
import { whatsappUrl } from '@/lib/site';
import type { EnvironmentId, OptionGroup, Selection, Vehicle } from '@/lib/types';

const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  // No loading component: the poster is already on screen underneath and swapping it for a
  // spinner would replace "something is there" with "something is missing".
  loading: () => null,
});

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}

/**
 * §14: if WebGL is unavailable the site must degrade, never error and never show a blank
 * box. `null` means "not decided yet" so we do not flash a fallback on a capable device.
 */
function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setSupported(Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl')));
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

export function ConfiguratorRoot({
  vehicle,
  initialSelection,
  fullHeight = false,
  showRiderCheck = true,
  stage = true,
  children,
}: {
  vehicle: Vehicle;
  /** From a share link (`?c=`) or /build/[id]. Falls back to the group defaults. */
  initialSelection?: string;
  fullHeight?: boolean;
  showRiderCheck?: boolean;
  /**
   * The framed-stage treatment (§9): a transparent canvas over the vehicle's own model code,
   * a ground streak under the wheels, the live total set as a monumental stat in the bay, and
   * the WhatsApp pill inside the bay rather than only in the sidebar.
   *
   * On by default — every surface the configurator appears on is inside a <Frame>. It exists
   * as a prop so `/build/[id]`, which is a shared configuration being reviewed rather than a
   * product being sold, can opt out of the theatre.
   */
  stage?: boolean;
  /** Extra panels — the before/after slider on the modification demo, for instance. */
  children?: React.ReactNode;
}) {
  const dict = useDict();
  const locale = useLocale();
  const t = useLocalized();
  const brand = useBrand();
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useWebGLSupport();

  const groups = vehicle.optionGroups;

  const [selection, setSelection] = useState<Selection>(() =>
    initialSelection ? decodeSelection(initialSelection, groups) : defaultSelection(groups),
  );
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>(
    () => vehicle.environments[0]?.id ?? 'showroom',
  );
  const [mode, setMode] = useState<'exterior' | 'interior'>('exterior');
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [ready, setReady] = useState(false);

  /*
   * SWAPPING THE VEHICLE WITHOUT REMOUNTING THE CANVAS.
   *
   * The homepage demo tabs change `vehicle` on a mounted configurator (§4.3: one WebGL
   * context alive at a time, data swapped in place). Keying this component instead would
   * tear down and rebuild the renderer on every tab press — which is exactly the thing that
   * kills a pitch on the fourth tab. Adjusting state during render is the documented React
   * pattern for "derive from props"; it costs one extra render pass and no effect round trip.
   */
  const [renderedVehicleId, setRenderedVehicleId] = useState(vehicle.id);
  if (renderedVehicleId !== vehicle.id) {
    setRenderedVehicleId(vehicle.id);
    setSelection(defaultSelection(groups));
    setMode('exterior');
    setReady(false);
    if (!vehicle.environments.some((preset) => preset.id === environmentId)) {
      setEnvironmentId(vehicle.environments[0]?.id ?? 'showroom');
    }
  }
  const [resetSignal, setResetSignal] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [shareLabel, setShareLabel] = useState(dict.configurator.shareBuild);

  const audio = useRef<EngineAudio | null>(null);

  /*
   * §6.3: the modification demo compares the vehicle as it arrived against the vehicle as we
   * would hand it back. The divider position lives in a ref because SplitCompare reads it
   * once per frame — putting it in state would re-render the whole panel on every pointermove.
   */
  const compareEnabled = vehicle.segment === 'modification';
  const splitRef = useRef(0.5);
  const beforeSelection = useMemo(() => defaultSelection(groups), [groups]);

  const environment = useMemo(
    () => vehicle.environments.find((preset) => preset.id === environmentId) ?? vehicle.environments[0],
    [vehicle.environments, environmentId],
  );

  const breakdown = useMemo(() => priceBreakdown(vehicle, selection), [vehicle, selection]);

  // --- Sound (§7.3) --------------------------------------------------------
  /** The exhaust option's `sound` effect names which note is fitted right now. */
  const activeSoundId = useMemo(() => {
    for (const group of groups) {
      for (const optionId of selection[group.id] ?? []) {
        const option = group.options.find((candidate) => candidate.id === optionId);
        const effect = option?.effects.find((entry) => entry.kind === 'sound');
        if (effect?.kind === 'sound') return effect.soundId;
      }
    }
    return null;
  }, [groups, selection]);

  const soundAvailable = Boolean(vehicle.sounds && activeSoundId && vehicle.sounds[activeSoundId]);

  const toggleSound = useCallback(async () => {
    /*
     * The synthesiser is imported on the FIRST TAP, never before. §7.3 forbids autoplay, so
     * the code is dead weight until the user asks for sound — and this is the configurator,
     * which every demo page loads.
     */
    if (!audio.current) {
      const { EngineAudio } = await import('@/lib/configurator/engine-audio');
      audio.current = new EngineAudio();
    }

    if (soundOn) {
      audio.current.stop();
      setSoundOn(false);
      return;
    }

    const set = activeSoundId ? vehicle.sounds?.[activeSoundId] : undefined;
    const profile = set ? synthProfileId(set.idleUrl) : null;
    if (!profile) return;

    // The AudioContext is constructed inside this handler and nowhere else: it is a user
    // gesture, which is both the browser's requirement and ours (§7.3, never autoplay).
    await audio.current.start(profile);
    setSoundOn(true);
  }, [soundOn, activeSoundId, vehicle.sounds]);

  // Changing the exhaust while sound is on cross-fades to that exhaust's note. This is the
  // moment §7.3 says is worth more in a bike showroom than any statistic on the page.
  useEffect(() => {
    if (!soundOn || !activeSoundId) return;
    const set = vehicle.sounds?.[activeSoundId];
    const profile = set ? synthProfileId(set.idleUrl) : null;
    if (profile) audio.current?.setExhaust(profile);
  }, [activeSoundId, soundOn, vehicle.sounds]);

  useEffect(() => {
    return () => {
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);

  // --- Actions -------------------------------------------------------------
  const handleToggle = useCallback((group: OptionGroup, optionId: string) => {
    setSelection((current) => toggleOption(current, group, optionId));
  }, []);

  /*
   * The share URL is empty until after mount. Reading `window.location` during render would
   * make the server and the first client render disagree, and the mismatch lands on the
   * WhatsApp button's href — the one element on the page that must never be wrong.
   */
  const [pageUrl, setPageUrl] = useState('');
  useEffect(() => {
    setPageUrl(window.location.origin + window.location.pathname);
  }, []);

  const shareUrl = useMemo(
    () => (pageUrl ? `${pageUrl}?c=${encodeSelection(selection)}` : ''),
    [pageUrl, selection],
  );

  const handleShare = useCallback(async () => {
    const config = encodeSelection(selection);

    /*
     * Try for a short /build/<id> link first: it survives being pasted into WhatsApp, and
     * saving the row is what turns configurations into demand data (Playbook §9). If the API
     * is unreachable — which in a showroom it very well might be — fall back to the
     * self-contained `?c=` link, which needs no server at all.
     */
    let url = `${window.location.origin}${window.location.pathname}?c=${config}`;

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          config,
          totalBDT: breakdown.total,
          prospect: brand.isProspect ? brand.wordmark : undefined,
          locale,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { id?: string };
        if (data.id) url = `${window.location.origin}${localePath(locale, `/build/${data.id}`)}`;
      }
    } catch {
      // Keep the ?c= link.
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: t(vehicle.name), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel(dict.configurator.shareCopied);
      window.setTimeout(() => setShareLabel(dict.configurator.shareBuild), 2000);
    } catch {
      // A cancelled share sheet throws. It is not an error and must not surface as one.
    }
  }, [
    selection,
    vehicle.id,
    vehicle.name,
    breakdown.total,
    brand.isProspect,
    brand.wordmark,
    locale,
    t,
    dict.configurator.shareCopied,
    dict.configurator.shareBuild,
  ]);

  const whatsappHref = useMemo(
    () =>
      whatsappUrl(
        brand.whatsapp,
        buildWhatsAppMessage({
          vehicle,
          selection,
          locale,
          intro: dict.configurator.whatsappIntro,
          outro: dict.configurator.whatsappOutro,
          totalLabel: dict.configurator.total,
          baseLabel: dict.configurator.basePrice,
          shareUrl,
        }),
      ),
    [brand.whatsapp, vehicle, selection, locale, dict.configurator, shareUrl],
  );

  // --- Poster paint colour, so the fallback matches the current selection ---
  const paintHex = useMemo(() => {
    const paintGroup = groups.find((group) => group.id === 'paint');
    const selectedId = paintGroup ? selection[paintGroup.id]?.[0] : undefined;
    return paintGroup?.options.find((option) => option.id === selectedId)?.swatchHex ?? '#3A3F42';
  }, [groups, selection]);

  /* The whole page's accented text follows the paint being configured. See src/lib/paint.ts. */
  useApplyPaintTint(paintHex);

  const modelCode = getModelCode(vehicle);

  const configSummary = useMemo(
    () =>
      groups
        .flatMap((group) =>
          (selection[group.id] ?? []).map((id) => {
            const option = group.options.find((candidate) => candidate.id === id);
            return option ? `${t(group.label)}: ${t(option.label)}` : null;
          }),
        )
        .filter(Boolean)
        .join(', '),
    [groups, selection, t],
  );

  const bayHeight = 'h-[46vh] min-h-[300px] lg:h-full';

  /*
   * The grid MUST be height-bounded on lg, in both modes.
   *
   * The panel column carries `lg:overflow-y-auto`, and `overflow-y-auto` on an unbounded box
   * does nothing at all: the grid row simply resolves to the tallest cell. With ~10 option
   * groups plus the spec sheet that made the embedded demo roughly 2,800px tall next to a
   * 528px canvas — a screen and a half of dead space beside the options, and the sticky price
   * summary never sticking because there was no scroll container for it to stick inside.
   */
  /*
   * Inside <DemoStage> the surface now loses the header AND both frame insets, so the height
   * contract has to name them rather than the old hard-coded 3.75rem — otherwise the frame's
   * bottom rim falls below the fold and the "we are watching a screen" reading breaks on
   * exactly the page it matters most on.
   */
  const frameHeight = fullHeight
    ? 'lg:h-[calc(100dvh-var(--ph-header-h)-2*var(--ph-frame-inset)-2rem)] lg:min-h-[560px]'
    : 'lg:h-[68vh] lg:min-h-[560px]';

  return (
    <div className={`grid min-w-0 lg:grid-cols-[minmax(0,1fr)_380px] ${frameHeight}`}>
      {/*
        The boot screen belongs to the full-height demo routes only. On the homepage the hero
        has already played it, and a second curtain on the same visit is theatre for its own
        sake — which is the thing the rebuild is trying to remove, not add.
      */}
      {fullHeight ? (
        <BootScreen
          modelUrl={vehicle.asset.glbUrl}
          segment={vehicle.segment}
          paintHex={paintHex}
          code={modelCode}
          wordmark={brand.wordmark}
          sceneReady={ready || webgl === false}
        />
      ) : null}

      {/* --- The bay ------------------------------------------------------ */}
      <div className={`bay canvas-host relative ${bayHeight}`}>
        {/* Sized down from the hero: the option panel takes the width, so the code bleeds less. */}
        {stage ? <Monolith code={modelCode} scale={0.6} /> : null}

        {webgl === false ? (
          <NoWebGL alt={dict.errors.canvasBody} />
        ) : (
          <div className="absolute inset-0 z-[1]">
            {webgl ? (
              <Scene
                vehicle={vehicle}
                selection={selection}
                environment={environment ?? vehicle.environments[0]!}
                mode={mode}
                quality={quality}
                resetSignal={resetSignal}
                reducedMotion={reducedMotion}
                showHotspots={ready}
                transparentBg={stage}
                compare={compareEnabled ? { before: beforeSelection, splitRef } : undefined}
                onReady={() => setReady(true)}
                onDowngrade={() => setQuality('low')}
              />
            ) : null}

            <PosterFallback
              segment={vehicle.segment}
              paintHex={paintHex}
              backgroundHex={environment?.background ?? '#101114'}
              visible={!ready}
              transparent={stage}
              alt={`${t(vehicle.name)} — ${dict.hero.canvasAlt}`}
              posterUrl={vehicle.asset.posterUrl}
            />
          </div>
        )}

        {stage ? <StageFloor /> : null}

        {/*
          §16: the canvas needs an accessible text alternative describing the vehicle and its
          CURRENT configuration. The canvas itself is aria-hidden; this is what is announced.
        */}
        <p className="sr-only" aria-live="polite">
          {t(vehicle.name)}. {configSummary}
        </p>

        {quality === 'low' ? (
          <p className="sheet-code absolute left-3 top-3 rounded-lg border border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_75%,transparent)] px-2.5 py-1.5 text-bay-alu backdrop-blur-md">
            {dict.configurator.qualityReduced}
          </p>
        ) : null}

        {compareEnabled && ready ? <SplitDivider splitRef={splitRef} /> : null}

        {/*
          THE TOTAL AS A STAGE ELEMENT (§9).

          Mirrors the hero's stat pair, and it is the reason it exists: the number the whole
          configurator produces should live in the bay, at monumental size, next to the thing
          it prices — not only as a sidebar figure the owner has to point at. Desktop only,
          because below `lg` the bay is 46vh and the sidebar total is already on screen.
        */}
        {stage ? (
          <div className="pointer-events-none absolute bottom-[4.75rem] left-6 z-20 hidden lg:block">
            <StatPair>
              <Stat
                figure={formatBDT(breakdown.total, false)}
                unit="৳"
                label={dict.configurator.total}
                tinted
              />
            </StatPair>
          </div>
        ) : null}

        {/*
          The lead path, inside the bay. The itemised breakdown stays in the sidebar; this is
          the one action that must never require scrolling to reach.
        */}
        {stage ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tap absolute bottom-[4.75rem] right-6 z-20 hidden items-center gap-2 rounded-full border border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_78%,transparent)] px-5 text-sm font-600 text-bay-ink backdrop-blur-md transition-colors duration-200 hover:border-[var(--ph-glass-border-lit)] lg:inline-flex"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
            {dict.configurator.sendToWhatsappShort}
          </a>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-20">
          <ActionBar
            vehicle={vehicle}
            vehicleTitle={t(vehicle.name)}
            environments={vehicle.environments}
            environmentId={environmentId}
            onEnvironment={setEnvironmentId}
            mode={mode}
            onMode={setMode}
            interiorAvailable={Boolean(vehicle.asset.interiorCamera)}
            soundAvailable={soundAvailable}
            soundOn={soundOn}
            onSound={() => void toggleSound()}
            onRev={() => audio.current?.rev()}
            onReset={() => {
              setMode('exterior');
              setResetSignal((value) => value + 1);
            }}
            onShare={() => void handleShare()}
            shareLabel={shareLabel}
          />
        </div>
      </div>

      {/*
        --- The panel: an INSPECTION CARD, not a widget (§9) ----------------
        Plate ground instead of glass, a champagne ceiling strip along its top edge, and hard
        hairlines between groups. It should read as the document that came with the vehicle.
      */}
      <aside className="lit-edge flex min-h-0 flex-col border-t border-plate-border bg-plate lg:border-l lg:border-t-0 lg:overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-plate-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="sheet-code sheet-code-accent">
              {dict.configurator.code}-{vehicle.segment.slice(0, 3).toUpperCase()}
            </p>
            <h2 className="display mt-1.5 text-xl font-700">{t(vehicle.name)}</h2>
          </div>
          <p className="sheet-code shrink-0 pt-1" lang="en">
            {modelCode}
          </p>
        </div>

        <div className="flex-1">
          <OptionPanel groups={groups} selection={selection} onToggle={handleToggle} />
          {showRiderCheck && vehicle.seatHeightMm ? (
            <RiderHeightCheck seatHeightMm={vehicle.seatHeightMm} />
          ) : null}
          {children}
          <SpecSheet vehicle={vehicle} />
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-glass-border-lit">
          <PriceSummary breakdown={breakdown} whatsappHref={whatsappHref} />
        </div>
      </aside>
    </div>
  );
}

function SpecSheet({ vehicle }: { vehicle: Vehicle }) {
  const dict = useDict();
  const t = useLocalized();

  return (
    <section className="border-b border-rule-faint px-4 py-6 sm:px-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <span className="text-sm font-600">{dict.configurator.specSheet}</span>
        <span className="sheet-code sheet-code-accent">SPEC</span>
      </div>
      {/*
        dt/dd are direct children of the grid on purpose. Wrapping each pair in a
        `display: contents` div would silently drop the hairline rule, because a
        contents box has no border to draw.
      */}
      <dl className="data-grid">
        {vehicle.specs.map((row) => (
          <Fragment key={row.key.en}>
            <dt className="text-sm text-ink-soft">{t(row.key)}</dt>
            <dd className="num text-right text-sm">{t(row.value)}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

function NoWebGL({ alt }: { alt: string }) {
  const dict = useDict();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="sheet-code">WEBGL / OFF</p>
      <p className="display text-lg font-700 text-bay-ink">{dict.errors.canvasTitle}</p>
      <p className="max-w-sm text-sm text-bay-alu">{alt}</p>
    </div>
  );
}
