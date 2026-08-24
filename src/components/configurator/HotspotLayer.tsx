'use client';

/**
 * Hotspots (§3, §5).
 *
 * These read like the hand-annotated damage diagram on an auction sheet: numbered pins,
 * honest labels, no euphemism. They are NOT marketing callouts — a pin that says "premium
 * craftsmanship" is worth nothing to a man who reads condition grades for a living.
 *
 * drei's <Html occlude> keeps a pin behind the bodywork when the camera swings around,
 * which is the difference between a pin that describes the vehicle and one that floats.
 */

import { Html } from '@react-three/drei';
import { useState } from 'react';
import { useLocalized } from '@/components/i18n/DictionaryProvider';
import type { Hotspot, Selection } from '@/lib/types';

export function HotspotLayer({
  hotspots,
  selection,
  visible,
}: {
  hotspots: Hotspot[];
  selection: Selection;
  visible: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const t = useLocalized();

  if (!visible) return null;

  const selected = new Set(Object.values(selection).flat());

  return (
    <>
      {hotspots.map((hotspot) => {
        // A pin tied to an option only exists while that option is fitted — the same rule
        // the 360° viewer's visibility arcs follow.
        if (hotspot.visibleWithOptions && !hotspot.visibleWithOptions.some((id) => selected.has(id))) {
          return null;
        }

        const open = openId === hotspot.id;

        return (
          <Html
            key={hotspot.id}
            position={hotspot.position}
            occlude
            /*
              3.2, not 6. `distanceFactor` scales the pin with camera distance, and the
              camera now solves its own framing (CameraRig `solveFraming`) so it sits much
              closer on a wide canvas than the authored 42-degree lens ever did. At 6 the
              pins rendered as dinner plates over the tank.
            */
            distanceFactor={open ? undefined : 3.2}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : hotspot.id)}
                aria-expanded={open}
                /*
                  The pin is an annotation, not an action: white on the stage, ink number,
                  like a printed diagram marker. It used to be `bg-ink`, which after the
                  palette flip is the LIGHT token — every pin rendered as an opaque white
                  disc sitting on top of the bodywork instead of annotating it.
                */
                className={`num flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[0.7rem] leading-none backdrop-blur-sm transition-all duration-200 ease-out ${
                  open
                    ? 'border-white bg-white text-ink shadow-elev'
                    : 'border-white/40 bg-black/45 text-white hover:scale-110 hover:border-white'
                }`}
              >
                {hotspot.index}
                <span className="sr-only"> — {t(hotspot.label)}</span>
              </button>

              {open ? (
                <div className="surface glass absolute left-4 top-4 w-60 p-3.5 text-ink shadow-elev">
                  <p className="sheet-code">PIN-{String(hotspot.index).padStart(2, '0')}</p>
                  <p className="mt-1.5 text-sm font-600 leading-snug">{t(hotspot.label)}</p>
                  {hotspot.detail ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t(hotspot.detail)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Html>
        );
      })}
    </>
  );
}
