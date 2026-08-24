'use client';

/**
 * Live BDT price summary (§7.4).
 *
 * Always visible, monospaced, updating instantly on every option change. Below it, one
 * button: send this build to WhatsApp. That button is the single most important conversion
 * action on the entire site — everything above it exists to get a thumb onto it.
 *
 * The layout is an invoice, not a card: hairline rules, right-aligned tabular figures, a
 * heavy rule above the total. That is how the number arrives already looking like a quote.
 */

import { useDict, useLocalized } from '@/components/i18n/DictionaryProvider';
import { formatBDT } from '@/lib/i18n/config';
import type { PriceBreakdown } from '@/lib/configurator/selection';

export function PriceSummary({
  breakdown,
  whatsappHref,
  compact = false,
}: {
  breakdown: PriceBreakdown;
  whatsappHref: string;
  compact?: boolean;
}) {
  const dict = useDict();
  const t = useLocalized();

  return (
    <div className="bg-paper-sunk">
      {!compact ? (
        <div className="px-4 pt-4 sm:px-5">
          <p className="sheet-code sheet-code-accent">{dict.configurator.code}-SUM</p>
          <table className="mt-3 w-full">
            <caption className="sr-only">{dict.configurator.summaryFor}</caption>
            <tbody>
              <tr className="border-b border-rule-faint">
                <th scope="row" className="py-1.5 text-left text-sm font-400 text-ink-soft">
                  {t(breakdown.base.label)}
                </th>
                <td className="num py-1.5 text-right text-sm">{formatBDT(breakdown.base.amountBDT)}</td>
              </tr>

              {breakdown.lines.map((line) => (
                <tr key={line.id} className="border-b border-rule-faint">
                  <th scope="row" className="py-1.5 text-left text-sm font-400 text-ink-soft">
                    {t(line.label)}
                  </th>
                  <td className="num py-1.5 text-right text-sm">{formatBDT(line.amountBDT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div
        className={`flex items-baseline justify-between gap-4 border-t border-glass-border-lit px-4 py-4 sm:px-5 ${compact ? '' : 'mt-2'}`}
      >
        <span className="text-sm font-600">{dict.configurator.total}</span>
        {/*
          EMBER, not champagne (§4.2). This is the number the configurator exists to produce
          and the last thing read before the WhatsApp button under it — it belongs on the
          action layer with that button, not on the decorative one.

          aria-live so a screen-reader user hears the total change with the selection.
        */}
        <span className="num text-2xl font-700 tabular-nums text-signal-lit" aria-live="polite">
          {formatBDT(breakdown.total)}
        </span>
      </div>

      <div className="px-4 pb-4 sm:px-5">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex items-center justify-center rounded-full bg-signal px-4 py-3 text-center text-sm font-600 leading-tight text-signal-ink transition-[filter] duration-200 hover:brightness-110"
        >
          {dict.configurator.sendToWhatsapp}
        </a>
      </div>
    </div>
  );
}
