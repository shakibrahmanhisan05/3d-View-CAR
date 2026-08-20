'use client';

/**
 * Footer — the closing plate, and the asset credits (§12.5).
 *
 * Listing CC0 assets costs nothing and signals to any client who asks that we know exactly
 * where every model came from. In a market where "we downloaded it off the internet" is the
 * norm, being able to open this modal in a meeting is worth more than it looks.
 */

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useBrand } from '@/components/brand/BrandProvider';
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
import { Button } from '@/components/ui/button';
import type { Credits } from '@/lib/credits';
import { localePath } from '@/lib/i18n/config';
import { FOOTER_NAV, PHOENIX_FACEBOOK, telUrl, whatsappUrl } from '@/lib/site';

export function Footer({ credits }: { credits: Credits }) {
  const dict = useDict();
  const locale = useLocale();
  const brand = useBrand();
  const [creditsOpen, setCreditsOpen] = useState(false);

  const waHref = whatsappUrl(brand.whatsapp, locale === 'bn' ? 'আসসালামু আলাইকুম।' : 'Hello —');

  return (
    <footer className="relative mt-28 border-t border-glass-border bg-paper-sunk">
      {/* A warm hairline of light along the top edge — the room's ceiling strip. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--ph-accent)_55%,transparent)] to-transparent"
      />

      <div className="mx-auto max-w-page px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="display-wide text-lg font-700 uppercase tracking-[0.24em]">{brand.wordmark}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{dict.common.tagline}</p>
            <p className="sheet-code mt-6">{dict.footer.builtIn}</p>
          </div>

          <nav aria-label={dict.footer.navLabel}>
            <p className="sheet-code sheet-code-accent mb-4">NAV</p>
            <ul className="space-y-2">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localePath(locale, item.href)}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {dict.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="sheet-code sheet-code-accent mb-4">CONTACT</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink transition-colors hover:text-accent-gold"
                >
                  {dict.common.whatsapp}
                </a>
              </li>
              <li>
                <a href={telUrl(brand.phone)} className="num text-ink transition-colors hover:text-accent-gold">
                  {brand.phone}
                </a>
              </li>
              <li className="leading-relaxed text-ink-soft">{brand.address[locale]}</li>
              <li>
                <a
                  href={PHOENIX_FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule-faint pt-6">
          <p className="sheet-code">
            {dict.footer.rights} · <span className="num">{new Date().getFullYear()}</span>
          </p>
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="sheet-code underline decoration-rule-strong underline-offset-4 transition-colors hover:text-accent-gold"
          >
            {dict.footer.creditsLink}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {creditsOpen ? <CreditsModal credits={credits} onClose={() => setCreditsOpen(false)} /> : null}
      </AnimatePresence>
    </footer>
  );
}

function CreditsModal({ credits, onClose }: { credits: Credits; onClose: () => void }) {
  const dict = useDict();
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label={dict.footer.creditsTitle}
      /*
        The scrim is black, not `bg-ink/70`. --ph-ink is the LIGHT token now, so the old
        value would have washed the page out instead of dimming it.
      */
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <m.div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden border border-glass-border bg-paper-raised shadow-elev-lg sm:rounded-2xl"
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-glass-border p-5">
          <div>
            <p className="sheet-code sheet-code-accent">LIC</p>
            <h2 className="display mt-1.5 text-xl font-700">{dict.footer.creditsTitle}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="tap rounded-lg px-2 text-2xl leading-none text-ink-soft transition-colors hover:text-ink"
          >
            <span className="sr-only">{dict.common.close}</span>×
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{dict.footer.creditsIntro}</p>

          <ul className="mt-6 space-y-5">
            {credits.entries.map((entry) => (
              <li key={entry.assetId} className="border-b border-rule-faint pb-4">
                <p className="num text-xs text-alu">{entry.file}</p>
                <p className="mt-1 text-sm">
                  <span className="text-ink-soft">{dict.footer.creditsAuthor}: </span>
                  <span className="font-600">{entry.author}</span>
                </p>
                <p className="text-sm">
                  <span className="text-ink-soft">{dict.footer.creditsLicense}: </span>
                  <span className="num">{entry.license}</span>
                  <span className="text-ink-soft"> · {entry.sourceSite}</span>
                </p>
                {entry.attributionText ? <p className="mt-1 text-sm">{entry.attributionText}</p> : null}
                <p className="mt-1 text-xs text-ink-soft">
                  {dict.footer.creditsModifications}: {entry.modifications}
                </p>
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="num mt-1.5 inline-block text-xs text-accent-gold underline underline-offset-2"
                >
                  {dict.footer.creditsSource} ↗
                </a>
              </li>
            ))}

            {credits.originals.length ? (
              <li>
                <p className="sheet-code sheet-code-accent mb-2">{dict.footer.creditsOriginal}</p>
                <ul className="space-y-2">
                  {credits.originals.map((entry) => (
                    <li key={entry.assetId} className="text-xs text-ink-soft">
                      <span className="num">{entry.file}</span> — {entry.modifications}
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="border-t border-glass-border p-4">
          <Button type="button" variant="outline" size="md" className="w-full" onClick={onClose}>
            {dict.common.close}
          </Button>
        </div>
      </m.div>
    </m.div>
  );
}
