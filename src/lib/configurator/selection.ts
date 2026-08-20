/**
 * Selection, pricing and the WhatsApp handoff (§7.4).
 *
 * The price summary is the most-watched element in the pitch and the WhatsApp button under
 * it is the single most important conversion action on the site, so all of this is pure,
 * synchronous and testable — no React, no three.js.
 */

import type { Locale, Localized, Option, OptionGroup, PriceLine, Segment, Selection, Vehicle } from '@/lib/types';
import { formatBDT } from '@/lib/i18n/config';

/** §5: one <OptionPanel> serves every segment; the filter is here, not in the component. */
export function groupsForSegment(groups: OptionGroup[], segment: Segment): OptionGroup[] {
  return groups.filter((group) => group.appliesTo.includes(segment));
}

export function defaultSelection(groups: OptionGroup[]): Selection {
  const selection: Selection = {};

  for (const group of groups) {
    const fallback = group.defaultOptionId ?? group.options[0]?.id;
    // Required groups always carry a selection; optional groups (body kit, accessories)
    // start empty, because a bike with every accessory bolted on is not the honest default.
    selection[group.id] = group.required && fallback ? [fallback] : [];
  }

  return selection;
}

export function toggleOption(
  selection: Selection,
  group: OptionGroup,
  optionId: string,
): Selection {
  const current = selection[group.id] ?? [];

  if (!group.multiSelect) {
    // Single-select: re-tapping a required group's choice keeps it; an optional group clears.
    const next = current.includes(optionId) && !group.required ? [] : [optionId];
    return { ...selection, [group.id]: next };
  }

  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];

  return { ...selection, [group.id]: next };
}

export function findOption(group: OptionGroup, optionId: string): Option | undefined {
  return group.options.find((option) => option.id === optionId);
}

export function selectedOptions(groups: OptionGroup[], selection: Selection): Array<{ group: OptionGroup; option: Option }> {
  const result: Array<{ group: OptionGroup; option: Option }> = [];

  for (const group of groups) {
    for (const optionId of selection[group.id] ?? []) {
      const option = findOption(group, optionId);
      if (option) result.push({ group, option });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Price (§7.4)
// ---------------------------------------------------------------------------

export type PriceBreakdown = { base: PriceLine; lines: PriceLine[]; total: number };

export function priceBreakdown(vehicle: Vehicle, selection: Selection): PriceBreakdown {
  const base: PriceLine = {
    id: 'base',
    label: { bn: 'বেস দাম', en: 'Base price' },
    amountBDT: vehicle.basePriceBDT,
  };

  const lines = selectedOptions(vehicle.optionGroups, selection)
    // A ৳0 option is not a line item on an invoice, and printing it makes the total harder
    // to read at a glance — which is the only thing this panel has to do well.
    .filter(({ option }) => option.priceDeltaBDT !== 0)
    .map(({ option }) => ({ id: option.id, label: option.label, amountBDT: option.priceDeltaBDT }));

  const total = lines.reduce((sum, line) => sum + line.amountBDT, vehicle.basePriceBDT);

  return { base, lines, total };
}

// ---------------------------------------------------------------------------
// Share links (§4 /build/[id], and the `c=` query the configurator reads on load)
// ---------------------------------------------------------------------------

/**
 * Compact, human-inspectable encoding: `paint~pearl-white.wheels~touring.bodykit~spoiler,roofrack`
 * Short enough for a WhatsApp message, and debuggable by eye when a dealer forwards a link
 * that does not look right.
 */
export function encodeSelection(selection: Selection): string {
  return Object.entries(selection)
    .filter(([, ids]) => ids.length > 0)
    .map(([groupId, ids]) => `${groupId}~${ids.join(',')}`)
    .join('.');
}

export function decodeSelection(encoded: string, groups: OptionGroup[]): Selection {
  const selection = defaultSelection(groups);
  if (!encoded) return selection;

  for (const chunk of encoded.split('.')) {
    const [groupId, ids] = chunk.split('~');
    if (!groupId || !ids) continue;

    const group = groups.find((candidate) => candidate.id === groupId);
    if (!group) continue;

    // A share link from an older build may name options that no longer exist. Drop them
    // silently rather than 404 — the dealer forwarding the link has no idea what changed.
    const valid = ids.split(',').filter((id) => findOption(group, id));
    if (valid.length) selection[groupId] = group.multiSelect ? valid : valid.slice(0, 1);
  }

  return selection;
}

// ---------------------------------------------------------------------------
// WhatsApp (§7.4) — the itemised build, in the reader's language
// ---------------------------------------------------------------------------

export function buildWhatsAppMessage({
  vehicle,
  selection,
  locale,
  intro,
  outro,
  totalLabel,
  baseLabel,
  shareUrl,
}: {
  vehicle: Vehicle;
  selection: Selection;
  locale: Locale;
  intro: string;
  outro: string;
  totalLabel: string;
  baseLabel: string;
  shareUrl?: string;
}): string {
  const { lines, total } = priceBreakdown(vehicle, selection);
  const name = (value: Localized) => value[locale];

  const rows = [
    `*${name(vehicle.name)}*`,
    '',
    `${baseLabel}: ${formatBDT(vehicle.basePriceBDT)}`,
    ...lines.map((line) => `+ ${name(line.label)}: ${formatBDT(line.amountBDT)}`),
    '',
    `*${totalLabel}: ${formatBDT(total)}*`,
  ];

  // Options that cost nothing still describe the build, so they are listed without a price.
  const freeOptions = selectedOptions(vehicle.optionGroups, selection)
    .filter(({ option }) => option.priceDeltaBDT === 0)
    .map(({ group, option }) => `${name(group.label)}: ${name(option.label)}`);

  if (freeOptions.length) rows.push('', ...freeOptions);
  if (shareUrl) rows.push('', shareUrl);

  return [intro, '', ...rows, '', outro].join('\n');
}
