'use client';

/**
 * ONE option panel, every segment (§5).
 *
 * It filters `optionGroups` by `appliesTo` against the vehicle's segment and renders the
 * three group types. There is no separate car configurator and bike configurator, and there
 * never will be — that duplication is what kills you at client four.
 *
 * The `swatch` renderer is the site's SIGNATURE ELEMENT: a physical paint-chip strip, with
 * the manufacturer's real paint name set small beneath and a monospaced delta. Everything
 * else on the page is disciplined so this one thing can be physical.
 */

import { useLocalized } from '@/components/i18n/DictionaryProvider';
import { useDict } from '@/components/i18n/DictionaryProvider';
import { formatDelta } from '@/lib/i18n/config';
import type { Option, OptionGroup, Selection } from '@/lib/types';
import { cn } from '@/lib/utils';

export function OptionPanel({
  groups,
  selection,
  onToggle,
}: {
  groups: OptionGroup[];
  selection: Selection;
  onToggle: (group: OptionGroup, optionId: string) => void;
}) {
  const dict = useDict();
  const t = useLocalized();

  if (!groups.length) {
    return <p className="p-5 text-sm text-ink-soft">{dict.configurator.noOptions}</p>;
  }

  return (
    <div>
      {groups.map((group) => {
        const selected = selection[group.id] ?? [];

        return (
          <fieldset key={group.id} className="border-b border-rule-faint px-4 py-6 last:border-b-0 sm:px-5">
            <legend className="sr-only">{t(group.label)}</legend>

            <div className="mb-4 flex items-baseline justify-between gap-3">
              <span className="text-sm font-600">{t(group.label)}</span>
              <span className="sheet-code sheet-code-accent">{group.code}</span>
            </div>

            {group.type === 'swatch' ? (
              <ChipStrip group={group} selected={selected} onToggle={onToggle} />
            ) : group.type === 'thumbnail' ? (
              <ThumbnailGrid group={group} selected={selected} onToggle={onToggle} />
            ) : (
              <ToggleList group={group} selected={selected} onToggle={onToggle} />
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The paint-chip strip — the signature element (docs/DESIGN-PLAN.md)
// ---------------------------------------------------------------------------

function ChipStrip({
  group,
  selected,
  onToggle,
}: {
  group: OptionGroup;
  selected: string[];
  onToggle: (group: OptionGroup, optionId: string) => void;
}) {
  const t = useLocalized();

  return (
    // Scroll-snapping on mobile: six chips do not fit a 360px screen, and a wrapped grid
    // loses the "strip of physical chips" reading entirely.
    <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-5 sm:px-5">
      {group.options.map((option) => {
        const active = selected.includes(option.id);

        return (
          <li key={option.id} className="snap-start">
            <button
              type="button"
              onClick={() => onToggle(group, option.id)}
              aria-pressed={active}
              className={cn(
                'tap block w-[5.25rem] rounded-xl border bg-glass p-1.5 text-left transition-all duration-300 ease-out',
                active
                  ? '-translate-y-1 border-[color-mix(in_oklab,var(--ph-accent)_60%,transparent)] shadow-glow-gold'
                  : 'border-glass-border hover:-translate-y-0.5 hover:border-[var(--ph-glass-border-lit)]',
              )}
            >
              <span className="relative block">
                <span
                  className="block h-12 w-full rounded-lg ring-1 ring-inset ring-black/40"
                  style={{ background: option.swatchHex ?? '#888' }}
                  aria-hidden="true"
                />
                {active ? (
                  // The stamp. Printed into the corner of the chip, as a grade mark is.
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-accent-gold text-[0.55rem] font-700 leading-none text-paper shadow-elev"
                  >
                    ✓
                  </span>
                ) : null}
              </span>

              <span className="mt-2 block text-[0.62rem] uppercase leading-tight tracking-[0.04em] text-ink-soft">
                {t(option.label)}
              </span>
              <span
                className={cn('num mt-1 block text-[0.65rem]', active ? 'text-accent-gold' : 'text-alu')}
              >
                {formatDelta(option.priceDeltaBDT)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------

function ThumbnailGrid({
  group,
  selected,
  onToggle,
}: {
  group: OptionGroup;
  selected: string[];
  onToggle: (group: OptionGroup, optionId: string) => void;
}) {
  const t = useLocalized();

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {group.options.map((option) => {
        const active = selected.includes(option.id);

        return (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onToggle(group, option.id)}
              aria-pressed={active}
              className={cn(
                'tap flex w-full flex-col items-start gap-1.5 rounded-xl border p-2 text-left transition-all duration-300 ease-out',
                active
                  ? 'border-[color-mix(in_oklab,var(--ph-accent)_60%,transparent)] bg-accent-sunk shadow-glow-gold'
                  : 'border-glass-border bg-glass hover:border-[var(--ph-glass-border-lit)]',
              )}
            >
              <span
                className="block h-9 w-full rounded-lg ring-1 ring-inset ring-black/40"
                style={{ background: thumbnailFill(option) }}
                aria-hidden="true"
              />
              <span className="text-xs leading-tight">{t(option.label)}</span>
              {option.note ? (
                <span className="text-[0.62rem] leading-tight text-alu">{t(option.note)}</span>
              ) : null}
              <span className={cn('num text-[0.65rem]', active ? 'text-accent-gold' : 'text-ink-soft')}>
                {formatDelta(option.priceDeltaBDT)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Thumbnails without artwork. Wrap and tank-pad options carry a `procedural:` map, so the
 * swatch is drawn from the same pattern name the 3D uses — the chip and the vehicle can
 * never disagree, which is the usual failure of hand-made swatch images.
 */
function thumbnailFill(option: Option): string {
  if (option.swatchHex) return option.swatchHex;

  const texture = option.effects.find((effect) => effect.kind === 'texture');
  if (texture?.kind === 'texture') {
    const id = texture.map.replace('procedural:', '');
    const fills: Record<string, string> = {
      carbon: 'repeating-linear-gradient(45deg,#2A2E31 0 4px,#171A1C 4px 8px)',
      'matte-black': '#1A1C1D',
      'racing-stripe': 'linear-gradient(90deg,#E8E9E3 34%,#C0261B 34% 46%,#17191A 46% 50%,#C0261B 50% 62%,#E8E9E3 62%)',
      'camo-urban': 'repeating-linear-gradient(120deg,#2C3134 0 12px,#5E666B 12px 20px,#454C50 20px 30px)',
      chequer: 'repeating-conic-gradient(#EDEEE8 0% 25%,#17191A 0% 50%) 50%/16px 16px',
      flame: 'linear-gradient(45deg,#17191A,#8E1512 45%,#C0261B 70%,#E8A317)',
    };
    return fills[id] ?? '#3A3F42';
  }

  return '#3A3F42';
}

// ---------------------------------------------------------------------------

function ToggleList({
  group,
  selected,
  onToggle,
}: {
  group: OptionGroup;
  selected: string[];
  onToggle: (group: OptionGroup, optionId: string) => void;
}) {
  const t = useLocalized();

  return (
    <ul>
      {group.options.map((option) => {
        const active = selected.includes(option.id);

        return (
          <li key={option.id} className="border-b border-rule-faint last:border-b-0">
            <button
              type="button"
              onClick={() => onToggle(group, option.id)}
              // Semantics matter to a screen reader here: a body-kit list is checkboxes,
              // a tint list is radios. Same visual row, different role.
              role={group.multiSelect ? 'checkbox' : 'radio'}
              aria-checked={active}
              className="tap group flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors duration-200 hover:bg-glass"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-[18px] shrink-0 items-center justify-center border transition-colors duration-200',
                  group.multiSelect ? 'rounded-[5px]' : 'rounded-full',
                  active
                    ? 'border-accent-gold bg-accent-gold'
                    : 'border-rule-strong group-hover:border-alu',
                )}
              >
                {active ? (
                  <span
                    className={cn(
                      'block bg-paper',
                      group.multiSelect ? 'h-[7px] w-[7px] rounded-[1px]' : 'size-[6px] rounded-full',
                    )}
                  />
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight">{t(option.label)}</span>
                {option.note ? (
                  <span className="block text-[0.7rem] leading-tight text-alu">{t(option.note)}</span>
                ) : null}
              </span>

              <span className={cn('num shrink-0 text-xs', active ? 'text-accent-gold' : 'text-ink-soft')}>
                {formatDelta(option.priceDeltaBDT)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
