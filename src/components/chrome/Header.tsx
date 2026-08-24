'use client';

/**
 * Site header.
 *
 * Calm by design: wordmark left, real links visible from `xl` up (a nav hidden behind an
 * index button on desktop reads as unfinished, and every extra tap costs a skeptical
 * visitor), language and WhatsApp right.
 *
 * It is frosted PAPER at every scroll position — not transparent-at-top — because the hero
 * beneath it is the dark stage, and dark text over that stage only becomes legible after the
 * page scrolls. A quiet paper bar above a spotlight reads as intentional; invisible nav does
 * not. Scrolling adds a hairline shadow, nothing else.
 *
 * Below `xl` the links collapse into one menu sheet. The sheet is the same pattern at every
 * width, so nothing about mobile changed.
 */

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBrand } from '@/components/brand/BrandProvider';
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
import { Button } from '@/components/ui/button';
import { localePath, LOCALE_LABEL, stripLocale } from '@/lib/i18n/config';
import { PRIMARY_NAV, whatsappUrl } from '@/lib/site';

export function Header() {
  const dict = useDict();
  const locale = useLocale();
  const brand = useBrand();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const current = stripLocale(pathname ?? '/');
  const otherLocale = locale === 'bn' ? 'en' : 'bn';

  // Close the sheet on navigation, and never leave the page locked if it unmounts open.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const waHref = whatsappUrl(
    brand.whatsapp,
    locale === 'bn'
      ? `আসসালামু আলাইকুম। ${brand.businessName[locale]}-এর ওয়েবসাইট নিয়ে কথা বলতে চাই।`
      : `Hello — I'd like to talk about a website for ${brand.businessName.en}.`,
  );

  const navItems = [...PRIMARY_NAV];

  return (
    <header
      className={`glass sticky top-0 z-40 border-b transition-shadow duration-300 ${
        scrolled ? 'shadow-elev-sm' : ''
      }`}
    >
      <div className="mx-auto flex h-header max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        {/* --- Wordmark ------------------------------------------------------ */}
        <Link
          href={localePath(locale, '/')}
          className="tap flex items-center gap-2.5"
          aria-label={brand.businessName[locale]}
        >
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" width={28} height={28} className="size-7 object-contain" />
          ) : (
            <PhoenixMark />
          )}
          <span className="display-wide whitespace-nowrap text-[1.05rem] font-700 uppercase tracking-[0.12em]">
            {brand.wordmark}
          </span>
        </Link>

        {/* --- Links, visible from lg --------------------------------------- */}
        <nav aria-label={dict.common.menu} className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = current === item.href || current.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={localePath(locale, item.href)}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[0.86rem] transition-colors duration-200 ${
                  active ? 'font-600 text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {dict.nav[item.key]}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-signal"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* --- Right: language · WhatsApp · menu ----------------------------- */}
        <div className="flex items-center gap-2">
          <Link
            href={localePath(otherLocale, current)}
            hrefLang={otherLocale}
            className="tap flex items-center rounded-lg px-2 text-[0.82rem] font-500 text-ink-soft transition-colors hover:text-ink"
            aria-label={`${dict.common.language}: ${LOCALE_LABEL[otherLocale]}`}
          >
            {LOCALE_LABEL[otherLocale]}
          </Link>

          {/*
            The wrapper is not decoration. `Button`'s base sets `inline-flex`, and without
            tailwind-merge (see src/lib/utils.ts) a `hidden` passed through `className` no
            longer reliably beats it — the winner becomes stylesheet order. Hiding the
            WRAPPER cannot conflict with anything the button sets.
          */}
          <div className="hidden sm:block">
            <Button asChild variant="primary" size="md">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                {dict.common.whatsapp}
              </a>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="ph-site-menu"
            className="tap -mr-2 flex items-center rounded-lg px-2 text-ink lg:hidden"
          >
            <MenuGlyph open={menuOpen} />
            <span className="sr-only">{menuOpen ? dict.common.close : dict.common.menu}</span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <m.div
            id="ph-site-menu"
            className="overflow-hidden border-t border-glass-border xl:hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav aria-label={dict.common.menu} className="mx-auto max-w-page px-4 pt-2 sm:px-6">
              <ul>
                {[...PRIMARY_NAV, { href: '/contact', key: 'contact' as const }].map((item) => (
                  <li key={item.href} className="border-b border-rule-faint last:border-b-0">
                    <Link
                      href={localePath(locale, item.href)}
                      className="tap flex items-center py-3.5 text-[1.05rem]"
                      aria-current={current === item.href ? 'page' : undefined}
                    >
                      <span className={current === item.href ? 'font-600 text-signal' : ''}>
                        {dict.nav[item.key]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mx-auto max-w-page px-4 py-5 sm:px-6 sm:hidden">
              <Button asChild variant="primary" size="md" className="w-full">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  {dict.common.whatsapp}
                </a>
              </Button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/**
 * The default wordmark glyph — a stylised phoenix wing cut from two arcs. One colour now:
 * a mark in the accent colour reads as a logo, a two-colour mark reads as decoration.
 * Drawn inline so it inherits the prospect's accent and costs no request; a prospect's own
 * `logoUrl` replaces it entirely.
 */
function PhoenixMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true" focusable="false" className="shrink-0">
      <path
        d="M14 2.5 C 9 7, 5.5 11, 4.5 17.5 C 8 14, 11 12.5, 14 12 C 17 12.5, 20 14, 23.5 17.5 C 22.5 11, 19 7, 14 2.5 Z"
        fill="var(--ph-signal)"
      />
      <path
        d="M14 14.5 C 11.5 16.5, 9.5 19.5, 9 25.5 C 11.5 22, 12.8 20.5, 14 19.8 C 15.2 20.5, 16.5 22, 19 25.5 C 18.5 19.5, 16.5 16.5, 14 14.5 Z"
        fill="var(--ph-signal)"
        opacity="0.55"
      />
    </svg>
  );
}

/** Two rules that become an X. Drawn, not imported — the only icon in the header. */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false" className="shrink-0">
      <line
        x1="2"
        y1={open ? '11' : '7'}
        x2="20"
        y2={open ? '11' : '7'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out"
        style={{ transform: open ? 'rotate(45deg)' : 'none', transformOrigin: '11px 11px' }}
      />
      <line
        x1="2"
        y1={open ? '11' : '15'}
        x2="20"
        y2={open ? '11' : '15'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out"
        style={{ transform: open ? 'rotate(-45deg)' : 'none', transformOrigin: '11px 11px' }}
      />
    </svg>
  );
}
