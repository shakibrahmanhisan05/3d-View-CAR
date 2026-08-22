/**
 * The flat side elevation, drawn in the currently-selected paint.
 *
 * Deliberately not an attempt at a render — a poor 3D-looking poster that then swaps to real
 * 3D reads as a downgrade. A clean technical drawing reads as intentional, and it matches the
 * auction-sheet language of the rest of the page.
 *
 * Extracted from <PosterFallback> because the hero's ExploreCard needs the same drawing at
 * thumbnail size, and the boot screen traces its outline. One silhouette, three jobs, so the
 * poster and the card can never disagree about what the vehicle looks like.
 */

import type { Segment } from '@/lib/types';

export function VehicleSilhouette({
  segment,
  paintHex,
  label,
  className,
  /** Stroke-only, for the boot screen's traced outline. */
  outline = false,
  /**
   * Drawn on a LIGHT ground — the hero's explore card is the one pale rectangle in the whole
   * composition. The default light hairline is invisible there, and a white paint like
   * `#E9EAE4` on the card's `#E7E8EA` would leave nothing on screen at all. On a light ground
   * the linework flips to ink and gets enough opacity to hold the shape on its own.
   */
  onLight = false,
}: {
  segment: Segment;
  paintHex: string;
  label?: string;
  className?: string;
  outline?: boolean;
  onLight?: boolean;
}) {
  const bike = segment === 'motorcycle';
  const fill = outline ? 'none' : paintHex;
  const line = onLight ? '#0A0B0D' : '#EFEFEA';
  const strokeOpacity = outline ? 0.9 : onLight ? 0.55 : 0.28;
  const stroke = outline ? paintHex : line;

  return (
    <svg
      viewBox={bike ? '0 0 220 130' : '0 0 460 160'}
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid meet"
    >
      {bike ? (
        <g>
          <path
            d="M62 96 L74 62 L104 54 L128 58 L150 60 L164 74 L158 84 L120 84 L96 96 Z"
            fill={fill}
            stroke={stroke}
            strokeOpacity={strokeOpacity}
            strokeWidth={outline ? 2 : 1}
            pathLength={outline ? 1 : undefined}
          />
          <path
            d="M104 54 L112 40 L142 40 L150 60"
            fill={outline ? 'none' : paintHex}
            fillOpacity={outline ? 0 : 0.85}
            stroke={outline ? stroke : 'none'}
            strokeOpacity={strokeOpacity}
            strokeWidth={outline ? 2 : 0}
            pathLength={outline ? 1 : undefined}
          />
          <circle cx="62" cy="96" r="26" fill="none" stroke={stroke} strokeOpacity={outline ? 0.9 : 0.5} strokeWidth={outline ? 2 : 7} pathLength={outline ? 1 : undefined} />
          <circle cx="164" cy="96" r="27" fill="none" stroke={stroke} strokeOpacity={outline ? 0.9 : 0.5} strokeWidth={outline ? 2 : 8} pathLength={outline ? 1 : undefined} />
          {outline ? null : (
            <>
              <circle cx="62" cy="96" r="12" fill="none" stroke={line} strokeOpacity={onLight ? 0.35 : 0.3} strokeWidth="2" />
              <circle cx="164" cy="96" r="12" fill="none" stroke={line} strokeOpacity={onLight ? 0.35 : 0.3} strokeWidth="2" />
            </>
          )}
        </g>
      ) : (
        <g>
          <path
            d="M28 108 L34 78 L92 70 L140 40 L268 38 L316 70 L420 78 L432 96 L430 112 L28 112 Z"
            fill={fill}
            stroke={stroke}
            strokeOpacity={strokeOpacity}
            strokeWidth={outline ? 2 : 1.2}
            pathLength={outline ? 1 : undefined}
          />
          {outline ? null : (
            <>
              <path d="M146 44 L200 42 L200 68 L112 70 Z" fill={line} fillOpacity={onLight ? 0.14 : 0.16} />
              <path d="M212 42 L262 44 L302 68 L212 68 Z" fill={line} fillOpacity={onLight ? 0.14 : 0.16} />
            </>
          )}
          <circle cx="116" cy="112" r="26" fill="none" stroke={stroke} strokeOpacity={outline ? 0.9 : 0.5} strokeWidth={outline ? 2 : 9} pathLength={outline ? 1 : undefined} />
          <circle cx="342" cy="112" r="26" fill="none" stroke={stroke} strokeOpacity={outline ? 0.9 : 0.5} strokeWidth={outline ? 2 : 9} pathLength={outline ? 1 : undefined} />
          {outline ? null : (
            <>
              <circle cx="116" cy="112" r="11" fill="none" stroke={line} strokeOpacity={onLight ? 0.35 : 0.3} strokeWidth="2" />
              <circle cx="342" cy="112" r="11" fill="none" stroke={line} strokeOpacity={onLight ? 0.35 : 0.3} strokeWidth="2" />
            </>
          )}
        </g>
      )}
    </svg>
  );
}
