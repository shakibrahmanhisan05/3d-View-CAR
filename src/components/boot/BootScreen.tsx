'use client';

/**
 * <BootScreen> — the first breath.
 *
 * WHY IT EXISTS
 * -------------
 * The vehicle is the headline. Before this, the first two seconds of the site were a dark
 * rectangle with a flat SVG poster in it while a 3–6 MB GLB came down a Chattogram mobile
 * connection — the visitor's first impression of a *3D company* was a page that had not
 * finished arriving. The boot screen turns that dead time into the opening shot: the frame's
 * letterbox curtains are already closed, the model code is already painted on the backdrop,
 * the vehicle's outline draws itself in its own paint colour, and when the model is genuinely
 * in memory the curtains part onto a hero that is ready to move on the first drag.
 *
 * THE PROGRESS IS REAL
 * --------------------
 * `useModelPreload` streams the GLB with `fetch` + a ReadableStream reader and reports actual
 * received-over-content-length. It is not a timer dressed up as a loader. Because
 * `/models/*.glb` ships `Cache-Control: immutable` (next.config.ts), the GLTFLoader request
 * that Scene.tsx makes moments later is served from the HTTP cache — so the preload costs one
 * download, not two, and the canvas is up almost the instant the curtains open.
 *
 * The bar the visitor sees is eased toward that real figure rather than snapped to it, so a
 * burst of chunks does not read as a stutter. It is monotonic: it never goes backwards.
 *
 * IT CAN NEVER TRAP ANYONE
 * ------------------------
 * A `MAX_WAIT` ceiling completes the screen regardless of the network, a skip control appears
 * after 2.5s and is keyboard-reachable, and a <noscript> rule removes the overlay entirely
 * when JS is unavailable. A loading screen that can strand a showroom owner on a bad 4G cell
 * is worse than no loading screen at all.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';
import { VehicleSilhouette } from '@/components/configurator/VehicleSilhouette';
import type { Segment } from '@/lib/types';

/** Hard ceiling. Past this the site opens whether or not the model has landed. */
const MAX_WAIT = 7000;
/** The skip control appears once the wait has stopped feeling instantaneous. */
const SKIP_AFTER = 2500;

/**
 * Module scope, deliberately.
 *
 * A full page load resets it — and should, because the model has to come down again. A
 * client-side navigation back to `/` does not, so returning to the homepage from `/pricing`
 * never replays the curtains for a model that is already in memory.
 */
let bootedThisSession = false;

// ---------------------------------------------------------------------------

function useModelPreload(url: string | undefined): { progress: number; done: boolean } {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(!url);

  useEffect(() => {
    if (!url) {
      setDone(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
        const total = Number(response.headers.get('content-length') ?? 0);

        // No stream or no length (a proxy stripped it, or the response is compressed and the
        // header describes the wire size): we cannot report bytes honestly, so we do not
        // pretend to. Wait for the body, then report complete.
        if (!response.body || !Number.isFinite(total) || total <= 0) {
          await response.arrayBuffer();
          if (!cancelled) {
            setProgress(1);
            setDone(true);
          }
          return;
        }

        const reader = response.body.getReader();
        let received = 0;
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          received += chunk.value?.byteLength ?? 0;
          if (!cancelled) setProgress(Math.min(0.999, received / total));
        }

        if (!cancelled) {
          setProgress(1);
          setDone(true);
        }
      } catch {
        // An abort, an offline cell, a 404 on a placeholder vehicle. None of them is a reason
        // to hold the door shut.
        if (!cancelled) {
          setProgress(1);
          setDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { progress, done };
}

// ---------------------------------------------------------------------------

export function BootScreen({
  modelUrl,
  segment,
  paintHex,
  code,
  wordmark,
  /** The hero reports its first rendered frame here; the curtains wait for it. */
  sceneReady = false,
}: {
  modelUrl?: string;
  segment: Segment;
  paintHex: string;
  code: string;
  wordmark: string;
  sceneReady?: boolean;
}) {
  const dict = useDict();

  /*
   * Read once, at mount, rather than through `useReducedMotion` — which would pull motion's
   * React runtime into every `/demo/*` bundle for one boolean. `false` on the server is the
   * right default: it renders the curtains closed, which is the state everyone starts in.
   */
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const [mounted, setMounted] = useState(() => !bootedThisSession);
  const [exiting, setExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [shown, setShown] = useState(0);

  const { progress, done } = useModelPreload(modelUrl);
  const finish = useRef<() => void>(() => {});

  /*
   * The eased bar.
   *
   * Target is the real byte figure held back to 92% until the scene reports its first frame,
   * because "100%" the instant the last byte lands and then a further beat of black while
   * three.js parses the GLB is the exact dishonesty this screen exists to remove.
   */
  const target = done && sceneReady ? 1 : Math.min(0.92, progress * 0.92);

  useEffect(() => {
    if (!mounted) return;
    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      setShown((current) => {
        // Exponential approach, framerate-independent, and monotonic by construction.
        const next = current + (target - current) * (1 - Math.pow(0.994, dt));
        return next > current ? next : current;
      });
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [mounted, target]);

  const close = useCallback(() => {
    bootedThisSession = true;
    setExiting(true);
    // Matches the curtain transition below. Under reduced motion it is effectively instant.
    window.setTimeout(() => setMounted(false), reduced ? 0 : 700);
  }, [reduced]);

  finish.current = close;

  // Lock the page while the curtains are closed — the hero behind is mid-assembly.
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  // The ceiling. Always armed, never cleared by a slow network.
  useEffect(() => {
    if (!mounted) return;
    const ceiling = window.setTimeout(() => finish.current(), MAX_WAIT);
    const skip = window.setTimeout(() => setShowSkip(true), SKIP_AFTER);
    return () => {
      window.clearTimeout(ceiling);
      window.clearTimeout(skip);
    };
  }, [mounted]);

  // The honest exit: bytes in, first frame rendered, bar caught up.
  useEffect(() => {
    if (!mounted || exiting) return;
    if (done && sceneReady && shown > 0.995) close();
  }, [mounted, exiting, done, sceneReady, shown, close]);

  if (!mounted) return null;

  const percent = Math.round(shown * 100);
  const stage =
    percent < 25
      ? dict.boot.stageLights
      : percent < 70
        ? dict.boot.stageModel
        : percent < 100
          ? dict.boot.stagePaint
          : dict.boot.stageReady;

  return (
    <div
      id="ph-boot"
      role="status"
      aria-live="polite"
      aria-label={dict.boot.label}
      /* `.stage` re-maps the token family onto the dark ground — this overlay is fixed to the
         viewport and sits outside any .bay ancestor, so without it its text inherits the
         light page theme and vanishes against the curtains. */
      className="stage fixed inset-0 z-[80] overflow-hidden"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
    >
      {/* If JS never arrives, neither does the code that would dismiss this. Remove it. */}
      <noscript>
        <style>{`#ph-boot{display:none!important}`}</style>
      </noscript>

      {/*
        THE CURTAINS. Two bay-coloured halves that part vertically on exit, so the boot screen
        does not fade into the hero — it *opens onto* it. The whole rebuild is built on the
        idea that the site is a cinema of one vehicle at a time, and this is the moment that
        says so before a single word has been read.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background: 'var(--ph-bay)',
          transform: exiting && !reduced ? 'translateY(-100%)' : 'translateY(0)',
          transition: reduced ? 'none' : 'transform 700ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: 'var(--ph-bay)',
          transform: exiting && !reduced ? 'translateY(100%)' : 'translateY(0)',
          transition: reduced ? 'none' : 'transform 700ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />

      {/* The seam where the two halves meet — a single lit hairline. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-white/15" />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        style={{
          opacity: exiting ? 0 : 1,
          transition: exiting && !reduced ? 'opacity 240ms ease-out' : 'none',
        }}
      >
        {/* The same model code that is about to appear behind the vehicle. The boot screen
            does not introduce the hero; it *is* the hero, with the lights still coming up. */}
        <span
          aria-hidden="true"
          lang="en"
          className="monolith absolute select-none"
          style={{ fontSize: 'clamp(7rem, 20vw, 18rem)', opacity: 0.45 }}
        >
          {code}
        </span>

        <div className="relative flex w-full max-w-[26rem] flex-col items-center">
          {/* The vehicle's own outline, in its own paint. */}
          <div className="mb-8 w-[16rem] sm:w-[20rem]">
            <VehicleSilhouette segment={segment} paintHex={paintHex} outline className="h-20 w-full sm:h-24" />
          </div>

          <p className="display-wide text-center text-sm font-700 uppercase tracking-[0.42em] text-white">
            {wordmark}
          </p>

          {/* The rail. One hairline, one signal fill, real bytes behind it. */}
          <div className="mt-8 w-full">
            <div className="mb-2.5 flex items-baseline justify-between gap-4">
              <span className="sheet-code text-white/50">{stage}</span>
              <span className="num text-xs font-700 tabular-nums text-paint">{percent}%</span>
            </div>

            <div aria-hidden="true" className="relative h-px w-full bg-white/15">
              <div
                className="absolute inset-y-0 left-0 bg-signal"
                style={{ width: `${percent}%`, transition: 'width 90ms linear' }}
              />
            </div>
          </div>

          {/*
            Reserved height whether or not the control is showing, so its arrival never nudges
            the rail — the one thing on screen the visitor is actually watching.
          */}
          <div className="mt-6 h-11">
            {showSkip && !exiting ? (
              <button
                type="button"
                onClick={close}
                className="tap sheet-code px-4 underline decoration-white/30 underline-offset-4 transition-colors hover:text-paint"
              >
                {dict.boot.skip}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
