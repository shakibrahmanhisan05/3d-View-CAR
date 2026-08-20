'use client';

/**
 * Segmented live demos (§4.3): গাড়ি · মোটরসাইকেল · মডিফিকেশন · ৩৬০° রিয়েল ভেহিকেল.
 *
 * ONLY ONE WEBGL CONTEXT ALIVE AT A TIME. The three 3D tabs share a single mounted
 * <ConfiguratorRoot>; switching between them swaps the vehicle DATA, not the canvas. The 360°
 * tab is DOM-and-images only, so selecting it unmounts the canvas entirely and frees the
 * context — which is also what makes it the WebGL-unavailable fallback (§14).
 *
 * §16 requires switching all four tabs six times to leak no GPU memory and not degrade FPS.
 * That is only achievable if the renderer is not rebuilt on every press.
 */

import { ArrowRight } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
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
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
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
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabId>('bike');

  const tabs: Array<{ id: TabId; label: string; href?: string }> = [
    { id: 'car', label: dict.demos.tabCar, href: '/demo/car' },
    { id: 'bike', label: dict.demos.tabBike, href: '/demo/bike' },
    { id: 'mod', label: dict.demos.tabMod, href: '/demo/modification' },
    { id: 'capture', label: dict.demos.tab360, href: '/demo/360' },
  ];

  const vehicle = tab === 'car' ? car : tab === 'bike' ? bike : modification;
  const active = tabs.find((entry) => entry.id === tab);

  return (
    <div>
      {/*
        Hand-rolled rather than <Tabs> from src/components/ui: Radix mounts and unmounts a
        <TabsContent> per value, which would rebuild the WebGL context on every tab press and
        break the one-context guarantee this whole component exists to hold. The rail is
        styled to match TabsList/TabsTrigger exactly so it still reads as the same control.
      */}
      <div
        role="tablist"
        aria-label={dict.demos.label}
        className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-glass-border bg-glass p-1"
      >
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            aria-controls="demo-panel"
            id={`demo-tab-${entry.id}`}
            onClick={() => setTab(entry.id)}
            className={cn(
              'tap relative flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-600 transition-colors duration-200',
              tab === entry.id ? 'text-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            {tab === entry.id ? (
              <m.span
                layoutId={reduced ? undefined : 'ph-demo-tab'}
                className="absolute inset-0 -z-10 rounded-lg bg-glass-strong shadow-elev-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
            {entry.label}
          </button>
        ))}
      </div>

      <div
        id="demo-panel"
        role="tabpanel"
        aria-labelledby={`demo-tab-${tab}`}
        className="mt-3 overflow-hidden rounded-2xl border border-glass-border shadow-elev-lg"
      >
        {tab === 'capture' ? (
          <Viewer360 capture={capture} />
        ) : (
          <ConfiguratorRoot vehicle={vehicle} showRiderCheck={vehicle.segment === 'motorcycle'} />
        )}
      </div>

      {active?.href ? (
        <p className="mt-5 text-right">
          <Link
            href={localePath(locale, active.href)}
            className="group inline-flex items-center gap-1.5 text-sm font-600 text-ink-soft transition-colors hover:text-accent-gold"
          >
            {dict.demos.openFull}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </p>
      ) : null}
    </div>
  );
}
