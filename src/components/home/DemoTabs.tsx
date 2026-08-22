'use client';

/**
 * Segmented live demos: গাড়ি · মোটরসাইকেল · মডিফিকেশন · ৩৬০° রিয়েল ভেহিকেল.
 *
 * ONLY ONE WEBGL CONTEXT ALIVE AT A TIME. The three 3D tabs share a single mounted
 * <ConfiguratorRoot>; switching between them swaps the vehicle DATA, not the canvas. The 360°
 * tab is DOM-and-images only, so selecting it unmounts the canvas entirely and frees the
 * context — which is also what makes it the WebGL-unavailable fallback (§14).
 *
 * §16 requires switching all four tabs six times to leak no GPU memory and not degrade FPS.
 * That is only achievable if the renderer is not rebuilt on every press.
 *
 * REVISION 2: the rail was four identical glass pills, which told the visitor nothing about
 * what was behind them. It is now a SHELF — each tab carries the vehicle's own silhouette, its
 * name and a monospaced short-code, so the choice is made from the picture rather than from
 * the word. And the panel below is a real <Frame>: a $60,000 product and a $2,500 product
 * should not sit in identical rounded rectangles (§8.2, §9).
 */

import { m, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { Frame } from '@/components/frame/Frame';
import { Arrow } from '@/components/frame/StageChrome';
import { VehicleSilhouette } from '@/components/configurator/VehicleSilhouette';
import { frameSrc } from '@/lib/capture360/placeholder-frames';
import { cn } from '@/lib/utils';

/*
 * Both panels are code-split. Only one is ever mounted, and on the homepage neither is needed
 * until the visitor presses a tab — keeping them in the page bundle costs every mobile
 * visitor kilobytes they may never use, against a 130 kB initial-JS budget (§14).
 */
const ConfiguratorRoot = dynamic(
  () => import('@/components/configurator/ConfiguratorRoot').then((m) => m.ConfiguratorRoot),
  { loading: () => <PanelSkeleton /> },
);
const Viewer360 = dynamic(() => import('@/components/capture360/Viewer360').then((m) => m.Viewer360), {
  loading: () => <PanelSkeleton />,
});
import { useDict, useLocale, useLocalized } from '@/components/i18n/DictionaryProvider';
import { localePath } from '@/lib/i18n/config';
import type { Capture360, Vehicle } from '@/lib/types';

/** Holds the bay's height while a panel chunk arrives, so the page never jumps (§14: zero CLS). */
function PanelSkeleton() {
  return (
    <div className="bay flex h-[46vh] min-h-[300px] items-center justify-center lg:h-[68vh]">
      <span className="size-6 animate-spin rounded-full border-2 border-glass-border border-t-accent-gold" />
    </div>
  );
}

type TabId = 'car' | 'bike' | 'mod' | 'capture';

export function DemoTabs({
  car,
  bike,
  modification,
  capture,
}: {
  car: Vehicle;
  bike: Vehicle;
  modification: Vehicle;
  capture: Capture360;
}) {
  const dict = useDict();
  const locale = useLocale();
  const t = useLocalized();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabId>('bike');

  /** The paint each tile's silhouette is drawn in — the group's default swatch. */
  const swatch = (vehicle: Vehicle) =>
    vehicle.optionGroups.find((group) => group.id === 'paint')?.options[0]?.swatchHex ?? '#3A3F42';

  const tabs: Array<{
    id: TabId;
    label: string;
    code: string;
    href: string;
    vehicle?: Vehicle;
  }> = [
    { id: 'car', label: dict.demos.tabCar, code: 'CFG-CAR', href: '/demo/car', vehicle: car },
    { id: 'bike', label: dict.demos.tabBike, code: 'CFG-BIKE', href: '/demo/bike', vehicle: bike },
    { id: 'mod', label: dict.demos.tabMod, code: 'CFG-MOD', href: '/demo/modification', vehicle: modification },
    { id: 'capture', label: dict.demos.tab360, code: 'CAP-360', href: '/demo/360' },
  ];

  const vehicle = tab === 'car' ? car : tab === 'bike' ? bike : modification;
  const active = tabs.find((entry) => entry.id === tab);

  return (
    <div>
      {/*
        Hand-rolled rather than <Tabs> from src/components/ui: Radix mounts and unmounts a
        <TabsContent> per value, which would rebuild the WebGL context on every tab press and
        break the one-context guarantee this whole component exists to hold.
      */}
      <div
        role="tablist"
        aria-label={dict.demos.label}
        className="no-scrollbar edge-fade flex w-full items-stretch gap-2 overflow-x-auto pb-1 pt-1"
      >
        {tabs.map((entry) => {
          const selected = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="demo-panel"
              id={`demo-tab-${entry.id}`}
              onClick={() => setTab(entry.id)}
              className={cn(
                'relative flex w-24 shrink-0 flex-col items-stretch gap-1.5 rounded-lg border p-3 text-left',
                'transition-[transform,border-color,background-color] duration-[260ms] ease-out',
                selected
                  ? '-translate-y-[3px] border-[var(--ph-glass-border-lit)] bg-glass-strong'
                  : 'border-glass-border bg-glass hover:border-[var(--ph-glass-border-lit)]',
              )}
            >
              {/* The champagne ceiling strip on the selected tile. */}
              {selected ? (
                <m.span
                  aria-hidden="true"
                  layoutId={reduced ? undefined : 'ph-demo-tab-edge'}
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, var(--ph-accent) 22%, var(--ph-accent) 78%, transparent)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              ) : null}

              <span className="block overflow-hidden rounded-md bg-bay">
                {entry.vehicle ? (
                  <VehicleSilhouette
                    segment={entry.vehicle.segment}
                    paintHex={swatch(entry.vehicle)}
                    className="h-10 w-full p-1"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- procedural data URI
                  // or an R2-hosted frame; next/image would add a round trip to a thumbnail.
                  <img
                    src={frameSrc(capture.framePattern, 0, capture.frameCount)}
                    alt=""
                    className="h-10 w-full object-cover"
                  />
                )}
              </span>

              <span className={cn('block text-xs font-600 leading-tight', selected ? 'text-ink' : 'text-ink-soft')}>
                {entry.label}
              </span>
              <span className="sheet-code text-[0.55rem]">{entry.code}</span>
            </button>
          );
        })}
      </div>

      {/*
        The panel is a cinema frame of its own — no letterbox, because the option panel needs
        every pixel of vertical space, and the ember rim comes from --ph-frame-shadow.
      */}
      <div id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${tab}`} className="mt-4">
        <Frame letterbox={false} bleed shellClassName="shadow-elev-lg">
          {tab === 'capture' ? (
            <Viewer360 capture={capture} />
          ) : (
            <ConfiguratorRoot vehicle={vehicle} showRiderCheck={vehicle.segment === 'motorcycle'} />
          )}
        </Frame>
      </div>

      {active ? (
        <p className="mt-5 text-right">
          <Link
            href={localePath(locale, active.href)}
            className="group inline-flex items-center gap-2 text-sm font-600 text-ink-soft transition-colors hover:text-paint"
          >
            {dict.demos.openFull}
            <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <span className="sr-only">{t(vehicle.name)}</span>
        </p>
      ) : null}
    </div>
  );
}
