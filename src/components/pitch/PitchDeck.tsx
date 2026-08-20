'use client';

/**
 * /pitch — offline presentation mode (§11).
 *
 * Six states, driven by keyboard or swipe, full-screen, no scroll, landscape-optimised for a
 * tablet held out toward the owner: hero → car → bike → 360° → ROI → pricing.
 *
 * The point is not the slideshow, it is the caching. Showroom wifi is unreliable and mobile
 * data inside a concrete building is worse; a spinner mid-pitch is a lost deal. Warm this at
 * home on good wifi, verify the "ready to present offline" line, then present with the
 * network off.
 *
 * ONE WEBGL CONTEXT: exactly one slide is mounted at a time, so stepping from the car to the
 * bike to the 360° tears down each scene before building the next.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfiguratorRoot } from '@/components/configurator/ConfiguratorRoot';
import { Viewer360 } from '@/components/capture360/Viewer360';
import { PricingTable } from '@/components/home/PricingTable';
import { RoiCalculator } from '@/components/roi/RoiCalculator';
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
import { useBrand } from '@/components/brand/BrandProvider';
import type { Capture360, Vehicle } from '@/lib/types';

type SlideId = 'hero' | 'car' | 'bike' | 'capture' | 'roi' | 'pricing';

export function PitchDeck({
  car,
  bike,
  capture,
  routes,
}: {
  car: Vehicle;
  bike: Vehicle;
  capture: Capture360;
  /** Routes to warm, so the deck survives the network being switched off. */
  routes: string[];
}) {
  const dict = useDict();
  const locale = useLocale();
  const brand = useBrand();

  const [index, setIndex] = useState(0);
  const [cache, setCache] = useState<'idle' | 'working' | 'ready' | 'failed'>('idle');
  const [cachedCount, setCachedCount] = useState(0);
  const touch = useRef<number | null>(null);

  const slides: Array<{ id: SlideId; label: string }> = [
    { id: 'hero', label: dict.pitch.slides.hero },
    { id: 'car', label: dict.pitch.slides.car },
    { id: 'bike', label: dict.pitch.slides.bike },
    { id: 'capture', label: dict.pitch.slides.capture },
    { id: 'roi', label: dict.pitch.slides.roi },
    { id: 'pricing', label: dict.pitch.slides.pricing },
  ];

  const go = useCallback(
    (delta: number) => setIndex((current) => Math.min(slides.length - 1, Math.max(0, current + delta))),
    [slides.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') go(1);
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(-1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // --- Warm the cache ------------------------------------------------------
  const warm = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setCache('failed');
      return;
    }
    setCache('working');

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      /*
       * Pull the 3D chunk in explicitly. It is behind `dynamic(ssr:false)`, so it does not
       * appear in performance entries until a 3D slide has actually been shown — and the
       * whole point of warming is to do it BEFORE the meeting.
       */
      await import('@/components/configurator/Scene');

      // Fetch each route so its HTML and RSC payload enter the cache.
      await Promise.all(routes.map((route) => fetch(route, { credentials: 'same-origin' }).catch(() => null)));

      const resources = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(window.location.origin) && !name.includes('/api/'));

      const urls = Array.from(new Set([...routes.map((route) => new URL(route, window.location.origin).href), ...resources]));

      const worker = registration.active ?? navigator.serviceWorker.controller;
      if (!worker) {
        setCache('failed');
        return;
      }
      worker.postMessage({ type: 'PRECACHE', urls });
    } catch {
      setCache('failed');
    }
  }, [routes]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; cached?: number; total?: number } | undefined;
      if (data?.type !== 'PRECACHE_DONE') return;
      setCachedCount(data.cached ?? 0);
      // Partial is still a win: the deck degrades to whatever cached rather than to nothing.
      setCache((data.cached ?? 0) > 0 ? 'ready' : 'failed');
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  const slide = slides[index];

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-paper"
      onTouchStart={(event) => {
        touch.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        const end = event.changedTouches[0]?.clientX;
        if (start === null || end === undefined) return;
        if (Math.abs(end - start) < 60) return;
        go(end < start ? 1 : -1);
      }}
    >
      {/* --- Top bar: identity, cache status, position --------------------- */}
      <header className="rule-b flex shrink-0 items-center justify-between gap-4 px-4 py-2">
        <span className="display-wide text-sm font-700 uppercase tracking-[0.2em]">{brand.wordmark}</span>

        <div className="flex items-center gap-3">
          {cache === 'ready' ? (
            <span className="sheet-code border border-ink px-2 py-1 text-ink">
              {dict.pitch.cacheReady} <span className="num">({cachedCount})</span>
            </span>
          ) : cache === 'working' ? (
            <span className="sheet-code">{dict.pitch.caching}…</span>
          ) : cache === 'failed' ? (
            <button type="button" onClick={() => void warm()} className="sheet-code border border-signal px-2 py-1 text-signal">
              {dict.pitch.cacheFailed}
            </button>
          ) : (
            <button type="button" onClick={() => void warm()} className="sheet-code border border-rule-strong px-2 py-1">
              {dict.pitch.offlineReady} →
            </button>
          )}

          <span className="num text-xs text-alu">
            {index + 1}/{slides.length}
          </span>
        </div>
      </header>

      {/* --- The slide ------------------------------------------------------ */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {slide?.id === 'hero' ? (
          <div className="flex h-full flex-col justify-center px-8 sm:px-16">
            <p className="sheet-code">{dict.hero.code}</p>
            <h1 className="display mt-4 max-w-4xl text-4xl font-700 leading-tight sm:text-6xl">{dict.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-soft sm:text-2xl">{dict.hero.sub}</p>
            <p className="num mt-10 text-sm text-alu">{brand.phone}</p>
          </div>
        ) : slide?.id === 'car' ? (
          <ConfiguratorRoot vehicle={car} showRiderCheck={false} fullHeight />
        ) : slide?.id === 'bike' ? (
          <ConfiguratorRoot vehicle={bike} fullHeight />
        ) : slide?.id === 'capture' ? (
          <div className="h-full overflow-y-auto">
            <Viewer360 capture={capture} />
          </div>
        ) : slide?.id === 'roi' ? (
          <div className="h-full overflow-y-auto px-6 py-6 sm:px-12">
            <RoiCalculator />
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-6 py-6 sm:px-12">
            <PricingTable locale={locale} />
          </div>
        )}
      </div>

      {/* --- Step control --------------------------------------------------- */}
      <nav className="rule-t flex shrink-0 gap-px bg-rule" aria-label={dict.pitch.title}>
        {slides.map((entry, position) => (
          <button
            key={entry.id}
            type="button"
            aria-current={position === index ? 'step' : undefined}
            onClick={() => setIndex(position)}
            className={`tap flex-1 px-2 text-xs ${
              position === index ? 'bg-ink text-paper' : 'bg-paper-raised hover:bg-paper-sunk'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
