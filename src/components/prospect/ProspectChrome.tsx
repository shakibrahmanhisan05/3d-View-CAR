'use client';

/**
 * The prospect's own header and footer (§10).
 *
 * Their name, their logo, their address, THEIR WhatsApp number. Every CTA below this points
 * at the owner's phone, so during the meeting he watches a real enquiry arrive on his own
 * handset. That is the moment that closes the deal, and it is worth more than the demo.
 *
 * The expiry banner is deliberately quiet but always present: it enforces the 14-day demo
 * window (Playbook §7.3 — the free build getting taken and never converted is a ~40% failure
 * mode, and the countermeasure is saying the window out loud, warmly, from the start).
 */

import { useDict, useLocalized } from '@/components/i18n/DictionaryProvider';
import { fill } from '@/lib/i18n';
import { telUrl, whatsappUrl } from '@/lib/site';
import type { Locale, Prospect } from '@/lib/types';

export function ProspectChrome({
  locale,
  prospect,
  children,
}: {
  locale: Locale;
  prospect: Prospect;
  children: React.ReactNode;
}) {
  const dict = useDict();
  const t = useLocalized();

  const expires = new Date(prospect.expiresAt);
  const expired = Number.isFinite(expires.getTime()) && expires.getTime() < Date.now();
  const expiryLabel = expires.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const waHref = whatsappUrl(
    prospect.whatsapp,
    locale === 'bn'
      ? `আসসালামু আলাইকুম। ${t(prospect.businessName)} — একটা গাড়ি নিয়ে জানতে চাই।`
      : `Hello — I'd like to ask about a vehicle at ${prospect.businessName.en}.`,
  );

  return (
    <>
      <header className="rule-b sticky top-0 z-40 bg-paper/95">
        <div className="mx-auto flex max-w-page items-stretch justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            {prospect.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a prospect logo is an
              // arbitrary remote file; registering every dealer's host in next.config would
              // break the "edit exactly one JSON file" acceptance test (§10).
              <img src={prospect.logoUrl} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            ) : null}
            <span className="flex flex-col leading-none">
              <span className="display-wide text-[0.95rem] font-700 uppercase tracking-[0.18em]">
                {t(prospect.businessName)}
              </span>
              <span className="sheet-code mt-1">{t(prospect.address)}</span>
            </span>
          </div>

          <div className="flex items-stretch gap-1">
            <a href={telUrl(prospect.phone)} className="tap hidden items-center px-3 text-sm sm:flex">
              <span className="num">{prospect.phone}</span>
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tap my-2 flex items-center bg-signal px-4 text-[0.85rem] font-600 text-signal-ink hover:brightness-110"
            >
              {dict.common.whatsapp}
            </a>
          </div>
        </div>
      </header>

      {/* The demo window, stated plainly. */}
      <p
        className={`px-4 py-2 text-center text-xs sm:px-6 ${
          expired ? 'bg-signal text-signal-ink' : 'bg-paper-sunk text-ink-soft'
        }`}
      >
        {expired ? dict.prospect.expired : fill(dict.prospect.expiresOn, { date: expiryLabel })}
      </p>

      <main id="main">{children}</main>

      <footer className="rule-t mt-24 bg-paper-sunk">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6">
          <p className="display-wide text-lg font-700 uppercase tracking-[0.18em]">
            {t(prospect.businessName)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">{t(prospect.address)}</p>

          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-signal">
                {dict.common.whatsapp}
              </a>
            </li>
            <li>
              <a href={telUrl(prospect.phone)} className="num text-ink hover:text-signal">
                {prospect.phone}
              </a>
            </li>
          </ul>

          {/*
            Phoenix's credit is one quiet line. The page has to read as the dealer's own site,
            not as our brochure with his name on it — that is the difference between a demo he
            shows his sales staff and one he closes the tab on.
          */}
          <p className="sheet-code mt-10">
            {dict.prospect.notPublic} · {dict.common.brandLatin}
          </p>
        </div>
      </footer>
    </>
  );
}
