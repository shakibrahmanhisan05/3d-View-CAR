'use client';

/**
 * The bar across the bottom of the bay: view reset, inside/outside, lighting, sound, share.
 *
 * Everything here is a control the owner is expected to press *himself* during a pitch, so
 * every target is ≥44px (§5.10) and every label is a word rather than a bare icon — an icon
 * he has to decode is an icon he does not press.
 */

import { ArButton } from './ArButton';
import { useDict, useLocalized } from '@/components/i18n/DictionaryProvider';
import type { EnvironmentPreset, Vehicle } from '@/lib/types';

export function ActionBar({
  vehicle,
  vehicleTitle,
  environments,
  environmentId,
  onEnvironment,
  mode,
  onMode,
  interiorAvailable,
  soundAvailable,
  soundOn,
  onSound,
  onRev,
  onReset,
  onShare,
  shareLabel,
}: {
  vehicle: Vehicle;
  vehicleTitle: string;
  environments: EnvironmentPreset[];
  environmentId: string;
  onEnvironment: (id: EnvironmentPreset['id']) => void;
  mode: 'exterior' | 'interior';
  onMode: (mode: 'exterior' | 'interior') => void;
  interiorAvailable: boolean;
  soundAvailable: boolean;
  soundOn: boolean;
  onSound: () => void;
  onRev: () => void;
  onReset: () => void;
  onShare: () => void;
  shareLabel: string;
}) {
  const dict = useDict();
  const t = useLocalized();

  return (
    <div className="on-bay pointer-events-auto flex flex-wrap items-stretch gap-1 border-t border-glass-border bg-[color-mix(in_oklab,var(--ph-bay)_82%,transparent)] p-1.5 text-bay-ink backdrop-blur-md">
      {/* Environment switch (§7.2) — the strongest single control in the pitch. */}
      <div className="flex flex-1 basis-full items-stretch gap-1 sm:basis-auto">
        <span className="sheet-code sheet-code-accent flex items-center px-2.5">{dict.configurator.environment}</span>
        {environments.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onEnvironment(preset.id)}
            aria-pressed={environmentId === preset.id}
            className={`tap flex flex-1 items-center justify-center rounded-lg px-3 text-xs font-600 transition-colors duration-200 ${
              environmentId === preset.id
                ? 'bg-ink text-paper shadow-elev-sm'
                : 'text-bay-ink/75 hover:bg-glass hover:text-bay-ink'
            }`}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>

      <div className="flex flex-1 items-stretch gap-1">
        {/* Interior view (§7.1). Disabled with an explicit state rather than faked. */}
        <button
          type="button"
          onClick={() => onMode(mode === 'interior' ? 'exterior' : 'interior')}
          disabled={!interiorAvailable}
          title={interiorAvailable ? undefined : dict.configurator.interiorUnavailable}
          className={`tap flex items-center justify-center rounded-lg px-3 text-xs font-600 transition-colors duration-200 ${
            mode === 'interior' ? 'bg-ink text-paper shadow-elev-sm' : 'text-bay-ink/75'
          } ${interiorAvailable ? 'hover:bg-glass hover:text-bay-ink' : 'cursor-not-allowed text-bay-alu'}`}
        >
          {mode === 'interior' ? dict.configurator.exterior : dict.configurator.interior}
          {!interiorAvailable ? <span className="sr-only"> — {dict.common.comingSoon}</span> : null}
        </button>

        {soundAvailable ? (
          <>
            <button
              type="button"
              onClick={onSound}
              aria-pressed={soundOn}
              className={`tap flex items-center justify-center rounded-lg px-3 text-xs font-600 transition-colors duration-200 ${
                soundOn
                  ? 'bg-signal text-signal-ink shadow-elev-sm'
                  : 'text-bay-ink/75 hover:bg-glass hover:text-bay-ink'
              }`}
            >
              {soundOn ? dict.configurator.soundOn : dict.configurator.soundOff}
            </button>
            {soundOn ? (
              <button
                type="button"
                onClick={onRev}
                className="tap flex items-center justify-center rounded-lg px-3 text-xs font-600 text-bay-ink/75 transition-colors duration-200 hover:bg-glass hover:text-bay-ink"
              >
                {dict.configurator.rev}
              </button>
            ) : null}
          </>
        ) : null}

        <ArButton vehicle={vehicle} title={vehicleTitle} />

        <button
          type="button"
          onClick={onReset}
          className="tap flex items-center justify-center rounded-lg px-3 text-xs font-600 text-bay-ink/75 transition-colors duration-200 hover:bg-glass hover:text-bay-ink"
        >
          {dict.configurator.resetView}
        </button>

        <button
          type="button"
          onClick={onShare}
          className="tap flex items-center justify-center rounded-lg px-3 text-xs font-600 text-bay-ink/75 transition-colors duration-200 hover:bg-glass hover:text-bay-ink"
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
