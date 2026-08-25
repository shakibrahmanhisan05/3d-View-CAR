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
import { VehicleSilhouette } from './VehicleSilhouette';
import type { Segment } from '@/lib/types';

export function PosterFallback({
  segment,
  paintHex,
  backgroundHex,
  visible,
  alt,
  posterUrl,
  transparent = false,
}: {
  segment: Segment;
  paintHex: string;
  backgroundHex: string;
  visible: boolean;
  alt: string;
  posterUrl?: string;
  /**
   * Inside <Frame> the poster must not paint a ground of its own: the 3D stage platform is
   * behind it, and covering the bay with an opaque rectangle for the first 1.6s would hide
   * the composition at exactly the moment it is meant to arrive. The bay is already painted
   * by CSS underneath.
   */
  transparent?: boolean;
}) {
  const dict = useDict();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-[400ms]"
      style={{ opacity: visible ? 1 : 0, background: transparent ? 'transparent' : backgroundHex }}
      aria-hidden={!visible}
    >
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- the poster is deliberately a
        // raw <img>: next/image's loader adds a round trip to the one asset whose entire job
        // is to be on screen before anything else.
        <img src={posterUrl} alt={alt} className="h-full w-full object-contain" width={1200} height={800} />
      ) : (
        <VehicleSilhouette segment={segment} paintHex={paintHex} label={alt} className="h-full w-full p-8 opacity-90" />
      )}

      <p className="sheet-code absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        {dict.configurator.loadingModel}
      </p>
    </div>
  );
}
