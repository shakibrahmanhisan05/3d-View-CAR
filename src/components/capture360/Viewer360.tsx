'use client';

/**
 * 360° real-vehicle viewer (§8).
 *
 * Commercially the more important of the two demos: it sells to the reconditioned-car
 * dealers, the largest prospect cluster in Chattogram, for whom a configurator is meaningless
 * (Playbook §1.2 — you cannot configure a car that only exists once).
 *
 * ZERO WEBGL. DOM and images only, so it works on the oldest phone in any showroom, and it
 * is also the fallback when WebGL is unavailable (§14).
 *
 * HONESTY IS THE ENTIRE PRODUCT HERE. The hotspots label real defects — "light scratch on
 * rear bumper" — because the single biggest friction in reconditioned car sales is the
 * buyer's suspicion that the photos are hiding damage.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { frameSrc, isProceduralCapture } from '@/lib/capture360/placeholder-frames';
import { formatBDT } from '@/lib/i18n/config';
import type { Capture360 } from '@/lib/types';

/** Frames loaded before anything else, so a quarter-turn works before the set is complete. */
const PRIORITY_STEPS = 4;

export function Viewer360({ capture }: { capture: Capture360 }) {
  const dict = useDict();
  const locale = useLocale();
  const t = useLocalized();

  const [frame, setFrame] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [openHotspot, setOpenHotspot] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; frame: number; lastX: number; lastT: number; velocity: number } | null>(null);
  const spin = useRef<number | null>(null);
  /** Fractional frame position, so momentum can decay smoothly and then snap to an integer. */
  const position = useRef(0);

  const sources = useMemo(
    () => Array.from({ length: capture.frameCount }, (_, index) => frameSrc(capture.framePattern, index, capture.frameCount)),
    [capture.framePattern, capture.frameCount],
  );

  /*
   * Preload frames 0, 8, 16, 24 first — a quarter-turn is usable within a second — then fill
   * the rest in the background. On a Chattogram mobile connection the difference between this
   * and a naive sequential load is the difference between a demo and a spinner.
   */
  useEffect(() => {
    let cancelled = false;
    const step = Math.max(1, Math.floor(capture.frameCount / PRIORITY_STEPS));
    const priority = Array.from({ length: PRIORITY_STEPS }, (_, i) => i * step);
    const rest = sources.map((_, index) => index).filter((index) => !priority.includes(index));

    const load = (index: number) =>
      new Promise<void>((resolve) => {
        const src = sources[index];
        if (!src) return resolve();
        const image = new Image();
        image.decoding = 'async';
        image.onload = image.onerror = () => {
          if (!cancelled) setLoadedCount((count) => count + 1);
          resolve();
        };
        image.src = src;
      });

    void (async () => {
      await Promise.all(priority.map(load));
      for (const index of rest) {
        if (cancelled) return;
        await load(index);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sources, capture.frameCount]);

  const wrap = useCallback(
    (value: number) => ((value % capture.frameCount) + capture.frameCount) % capture.frameCount,
    [capture.frameCount],
  );

  const stopSpin = useCallback(() => {
    if (spin.current !== null) cancelAnimationFrame(spin.current);
    spin.current = null;
  }, []);

  /**
   * Drag, then coast (§8: "momentum with friction, snapping to nearest frame").
   *
   * The flick is what makes a 32-frame image sequence feel like an object rather than a
   * slideshow, and it is the first thing an owner does when the phone is put in his hand.
   * Position is tracked as a float and only rounded for display, so the decay is smooth and
   * the rest lands exactly on a frame.
   */
  useEffect(() => {
    const element = stage.current;
    if (!element) return;

    const pixelsPerFrame = () => Math.max(6, element.clientWidth / capture.frameCount / 1.6);

    const commit = (value: number) => {
      position.current = value;
      setFrame(wrap(Math.round(value)));
    };

    const down = (event: PointerEvent) => {
      stopSpin();
      drag.current = {
        x: event.clientX,
        frame: position.current,
        lastX: event.clientX,
        lastT: event.timeStamp,
        velocity: 0,
      };
      element.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      const state = drag.current;
      if (!state) return;

      const delta = (event.clientX - state.x) / pixelsPerFrame();
      if (Math.abs(delta) > 0.5) setHasDragged(true);

      const dt = event.timeStamp - state.lastT;
      if (dt > 0) {
        // Frames per millisecond, smoothed — a raw last-sample velocity makes the flick
        // wildly inconsistent between a trackpad and a thumb.
        const instant = -(event.clientX - state.lastX) / pixelsPerFrame() / dt;
        state.velocity = state.velocity * 0.7 + instant * 0.3;
        state.lastX = event.clientX;
        state.lastT = event.timeStamp;
      }

      commit(state.frame - delta);
    };

    const up = (event: PointerEvent) => {
      const state = drag.current;
      drag.current = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (!state) return;

      let velocity = state.velocity;
      let last = performance.now();

      const step = (now: number) => {
        const dt = Math.min(48, now - last);
        last = now;

        commit(position.current + velocity * dt);
        velocity *= Math.pow(0.9955, dt); // friction, framerate-independent

        if (Math.abs(velocity) < 0.0009) {
          commit(Math.round(position.current)); // snap
          spin.current = null;
          return;
        }
        spin.current = requestAnimationFrame(step);
      };

      if (Math.abs(velocity) > 0.002) spin.current = requestAnimationFrame(step);
      else commit(Math.round(position.current));
    };

    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
    };
  }, [wrap, capture.frameCount, stopSpin]);

  useEffect(() => stopSpin, [stopSpin]);

  const visibleHotspots = capture.hotspots.filter((hotspot) =>
    // The visibility arc: a pin on the rear bumper exists only across the frames where that
    // bumper is actually in shot. Wrapping ranges (28 → 3) are normal on a turntable.
    hotspot.fromFrame <= hotspot.toFrame
      ? frame >= hotspot.fromFrame && frame <= hotspot.toFrame
      : frame >= hotspot.fromFrame || frame <= hotspot.toFrame,
  );

  const ready = loadedCount >= PRIORITY_STEPS;
  const progress = Math.round((loadedCount / capture.frameCount) * 100);

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* --- Stage --------------------------------------------------------- */}
      <div className="bay relative">
        {/*
          THE AUCTION GRADE, STRUCK LARGE (§10).

          This is the highest-ROI product Phoenix sells and the grade is the single fact a
          reconditioned-car buyer looks for first. It used to be a 12px pill in the bottom
          bar next to the drag hint. It is now an 80px seal in the top-right corner of the
          stage — the same object as the ROI ledger's stamp and the contact envelope's, and
          it is reading real data off the capture, so it is not decoration.
        */}
        {/*
          Size and type size are inline, not utilities: `.seal` is an unlayered rule and beats
          Tailwind on the same properties, so `size-20 text-base` here would have rendered an
          80px disc's worth of intent as a 40px one. See <Seal> in StageChrome for the same note.
        */}
        <span
          className="seal absolute right-4 top-4 z-20 font-700 backdrop-blur-sm"
          style={{ width: 80, height: 80, fontSize: '1.5rem' }}
        >
          <span className="sr-only">{dict.common.stampGrade}: </span>
          <span aria-hidden="true" className="num">
            {capture.auctionGrade}
          </span>
        </span>

        <div
          ref={stage}
          className="relative aspect-[3/2] w-full cursor-grab touch-none select-none active:cursor-grabbing"
          role="img"
          aria-label={`${t(capture.title)} — ${dict.viewer360.frame} ${frame + 1}/${capture.frameCount}`}
        >
          {/* The same ground streak and horizon line the 3D bay stands on. */}
          <div aria-hidden="true" className="stage-floor z-[1]" />
          {sources.map((src, index) => (
            // Every frame stays mounted and only the current one is opaque: swapping `src` on
            // a single <img> shows a blank flash on each step, which on a drag reads as a
            // stutter. Non-current frames are cheap — the browser keeps them decoded.
            // eslint-disable-next-line @next/next/no-img-element -- procedural data URIs and
            // R2-hosted frames; next/image would add a round trip to a drag surface.
            <img
              key={index}
              src={src}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: index === frame ? 1 : 0 }}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          ))}

          {!ready ? (
            <p className="sheet-code absolute inset-0 flex items-center justify-center text-bay-alu">
              {dict.viewer360.loadingFrames} <span className="num ml-2">{progress}%</span>
            </p>
          ) : null}

          {visibleHotspots.map((hotspot) => {
            const open = openHotspot === hotspot.id;
            return (
              <div key={hotspot.id} className="absolute z-10" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}>
                <button
                  type="button"
                  onClick={() => setOpenHotspot(open ? null : hotspot.id)}
                  aria-expanded={open}
                  /*
                    A defect keeps the signal colour — this is a condition report and a
                    dealer needs the damage to read as damage. A plain note is a white
                    diagram marker, same grammar as the configurator's pins.
                  */
                  className={`num flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.7rem] backdrop-blur-sm transition-all duration-200 ease-out hover:scale-110 ${
                    hotspot.severity === 'defect'
                      ? 'border-signal bg-signal text-signal-ink shadow-elev'
                      : 'border-white/40 bg-black/45 text-white hover:border-white'
                  }`}
                >
                  <span aria-hidden="true">{hotspot.severity === 'defect' ? '!' : 'i'}</span>
                  <span className="sr-only">{t(hotspot.label)}</span>
                </button>

                {open ? (
                  <div className="surface glass absolute left-4 top-4 z-10 w-56 p-3.5 text-ink shadow-elev">
                    <p className={hotspot.severity === 'defect' ? 'sheet-code text-signal-lit' : 'sheet-code'}>
                      {hotspot.severity === 'defect' ? dict.viewer360.severityDefect : dict.viewer360.severityNote}
                    </p>
                    <p className="mt-1 text-sm font-600 leading-snug">{t(hotspot.label)}</p>
                    {hotspot.detail ? (
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{t(hotspot.detail)}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/*
          THE FRAME COUNT, MONUMENTAL (§10).

          It was a subtle progress hint. It is now a monospaced fraction at stat-figure size in
          the bottom-left of the stage — the same object, in the same corner, as the hero's
          base price and the configurator's total. Three flagship surfaces, one grammar.
        */}
        <div className="pointer-events-none absolute bottom-14 left-6 z-20 hidden sm:block">
          <p className="flex items-baseline">
            <span className="stat-figure text-ink">{String(frame + 1).padStart(2, '0')}</span>
            <span className="stat-unit">/ {capture.frameCount}</span>
          </p>
          <span className="stat-label">{dict.viewer360.frame}</span>
        </div>

        <div className="on-bay relative z-20 flex items-center justify-between gap-4 border-t border-bay-rule px-4 py-2.5 text-bay-alu">
          <span className="sheet-code flex items-center gap-2">
            {/* A drag affordance the visitor can see before they touch anything. */}
            <span aria-hidden="true" className={hasDragged ? 'opacity-0' : 'text-signal-lit'}>
              &#8596;
            </span>
            {hasDragged ? `${dict.viewer360.frame} ${frame + 1}/${capture.frameCount}` : dict.viewer360.dragHint}
          </span>
        </div>

        {isProceduralCapture(capture.framePattern) ? (
          <p className="border-t border-bay-rule px-4 py-2 text-xs text-bay-alu">{dict.viewer360.placeholderNote}</p>
        ) : null}
      </div>

      {/*
        --- Auction-sheet data panel (§10) ---------------------------------
        A PLATE with a champagne ceiling strip, matching the configurator's option panel
        exactly. The two flagship products should read as two sheets from the same folder.
      */}
      <aside className="lit-edge border-t border-plate-border bg-plate lg:border-l lg:border-t-0">
        <div className="flex items-start justify-between gap-3 border-b border-plate-border px-5 py-4">
          <div className="min-w-0">
            <p className="sheet-code sheet-code-accent">{dict.viewer360.code}-DATA</p>
            <h3 className="display mt-1 text-lg font-700">{t(capture.title)}</h3>
          </div>
          <span className="sheet-code shrink-0 pt-1">{dict.viewer360.grade}</span>
        </div>

        <dl className="data-grid px-5 py-4">
          {capture.specs.map((row) => (
            <Fragment key={row.key.en}>
              <dt className="text-sm text-ink-soft">{t(row.key)}</dt>
              <dd className="num text-right text-sm">{t(row.value)}</dd>
            </Fragment>
          ))}
          <dt className="text-sm font-600">{dict.viewer360.price}</dt>
          <dd className="num text-right text-base font-600">{formatBDT(capture.priceBDT)}</dd>
        </dl>

        <div className="rule-t px-5 py-4">
          <p className="sheet-code mb-1">{dict.viewer360.defectsTitle}</p>
          <p className="mb-3 text-xs text-ink-soft">{dict.viewer360.defectsIntro}</p>
          <ul>
            {capture.hotspots.map((hotspot) => (
              <li key={hotspot.id} className="border-b border-rule-faint py-2 last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    // Jump to a frame where this pin is actually in shot, then open it.
                    stopSpin();
                    position.current = hotspot.fromFrame;
                    setFrame(hotspot.fromFrame);
                    setOpenHotspot(hotspot.id);
                    setHasDragged(true);
                  }}
                  className="flex w-full items-baseline gap-3 text-left"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 ${hotspot.severity === 'defect' ? 'bg-signal' : 'bg-alu'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-tight">{t(hotspot.label)}</span>
                    {hotspot.detail ? (
                      <span className="block text-xs leading-tight text-ink-soft">{t(hotspot.detail)}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rule-t px-5 py-4">
          <p className="text-xs text-alu" lang={locale === 'bn' ? 'bn-BD' : 'en-GB'}>
            {dict.viewer360.dataPanel}
          </p>
        </div>
      </aside>
    </div>
  );
}
