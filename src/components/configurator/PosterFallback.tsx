'use client';

/**
 * The poster (§5, progressive loading).
 *
 * t=0.0s the server shell paints and this is visible. t~1.6s the first 3D frame is up and
 * this cross-fades out over 400ms. If the poster is not visible in under one second, that
 * is a bug, not a slow network.
 *
 * `asset.posterUrl` takes a real <40 kB WebP once renders exist. Until then it is drawn
 * inline as SVG: same silhouette, same paint colour as the current selection, zero bytes
 * and zero requests — so the "something is there" moment cannot be lost to the network.
 */

import { useDict } from '@/components/i18n/DictionaryProvider';
import type { Segment } from '@/lib/types';

export function PosterFallback({
  segment,
  paintHex,
  backgroundHex,
  visible,
  alt,
  posterUrl,
}: {
  segment: Segment;
  paintHex: string;
  backgroundHex: string;
  visible: boolean;
  alt: string;
  posterUrl?: string;
}) {
  const dict = useDict();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-[400ms]"
      style={{ opacity: visible ? 1 : 0, background: backgroundHex }}
      aria-hidden={!visible}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- the poster is deliberately a
        // raw <img>: next/image's loader adds a round trip to the one asset whose entire job
        // is to be on screen before anything else.
        <img src={posterUrl} alt={alt} className="h-full w-full object-contain" width={1200} height={800} />
      ) : (
        <VehicleSilhouette segment={segment} paintHex={paintHex} label={alt} />
      )}

      <p className="sheet-code absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        {dict.configurator.loadingModel}
      </p>
    </div>
  );
}

/**
 * Flat side elevations. Deliberately not an attempt at a render — a poor 3D-looking poster
 * that then swaps to real 3D reads as a downgrade. A clean technical drawing reads as
 * intentional, and it matches the auction-sheet language of the rest of the page.
 */
function VehicleSilhouette({ segment, paintHex, label }: { segment: Segment; paintHex: string; label: string }) {
  const bike = segment === 'motorcycle';

  return (
    <svg
      viewBox={bike ? '0 0 220 130' : '0 0 460 160'}
      className="h-full w-full p-8 opacity-90"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {bike ? (
        <g>
          <path
            d="M62 96 L74 62 L104 54 L128 58 L150 60 L164 74 L158 84 L120 84 L96 96 Z"
            fill={paintHex}
            stroke="#EFEFEA"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          <path d="M104 54 L112 40 L142 40 L150 60" fill={paintHex} fillOpacity="0.85" />
          <circle cx="62" cy="96" r="26" fill="none" stroke="#EFEFEA" strokeOpacity="0.5" strokeWidth="7" />
          <circle cx="164" cy="96" r="27" fill="none" stroke="#EFEFEA" strokeOpacity="0.5" strokeWidth="8" />
          <circle cx="62" cy="96" r="12" fill="none" stroke="#EFEFEA" strokeOpacity="0.3" strokeWidth="2" />
          <circle cx="164" cy="96" r="12" fill="none" stroke="#EFEFEA" strokeOpacity="0.3" strokeWidth="2" />
        </g>
      ) : (
        <g>
          <path
            d="M28 108 L34 78 L92 70 L140 40 L268 38 L316 70 L420 78 L432 96 L430 112 L28 112 Z"
            fill={paintHex}
            stroke="#EFEFEA"
            strokeOpacity="0.28"
            strokeWidth="1.2"
          />
          <path d="M146 44 L200 42 L200 68 L112 70 Z" fill="#EFEFEA" fillOpacity="0.16" />
          <path d="M212 42 L262 44 L302 68 L212 68 Z" fill="#EFEFEA" fillOpacity="0.16" />
          <circle cx="116" cy="112" r="26" fill="none" stroke="#EFEFEA" strokeOpacity="0.5" strokeWidth="9" />
          <circle cx="342" cy="112" r="26" fill="none" stroke="#EFEFEA" strokeOpacity="0.5" strokeWidth="9" />
          <circle cx="116" cy="112" r="11" fill="none" stroke="#EFEFEA" strokeOpacity="0.3" strokeWidth="2" />
          <circle cx="342" cy="112" r="11" fill="none" stroke="#EFEFEA" strokeOpacity="0.3" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
