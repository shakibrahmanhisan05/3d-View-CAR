'use client';

/**
 * Site header — frosted chrome floating inside the cinema frame.
 *
 * It starts transparent so the hero composition runs edge to edge under it, and fuses into
 * glass once the page has moved. That transition is the only piece of scroll-linked styling
 * on the site: it is a boolean at an 8px threshold, not a scrubbed value, so it costs one
 * class swap rather than a paint per frame.
 *
 * REVISION 2 — THE SILENCE (§2.10)
 * --------------------------------
 * The header was a left wordmark, seven centre links and three right controls: eleven things
 * competing across the top of a composition whose whole job is to have one subject. It is now
 * three cells — index left, wordmark centred, language and WhatsApp right — and the seven
 * links live in a sheet one tap away, at every viewport rather than only on mobile.
 *
 * This is a deliberate trade: one tap of depth on the nav, in exchange for a masthead that
 * frames the vehicle instead of crowding it. The sheet is the same component that already
 * carried the mobile nav, so nothing became less reachable — the links moved, they did not go.
 *
 * The scrolled hairline is a warm champagne gradient rather than a flat rule, matching the
 * footer's ceiling strip: the page is a lit room, and both of its edges catch the same light.
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

  const lit = scrolled || menuOpen;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,backdrop-filter] duration-300 ${
        lit ? 'glass' : 'bg-transparent'
      }`}
    >
      {/* The warm hairline. Only present once the header has fused. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-300"
        style={{
          opacity: lit ? 1 : 0,
          background:
            'linear-gradient(90deg, transparent, color-mix(in oklab, var(--ph-accent) 55%, transparent) 20%, color-mix(in oklab, var(--ph-accent) 55%, transparent) 80%, transparent)',
        }}
      />

      <div className="mx-auto grid h-header max-w-page grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        {/* --- Left: the index --------------------------------------------- */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="ph-site-menu"
            className="tap -ml-2 flex items-center gap-2.5 rounded-lg px-2 text-ink transition-colors hover:text-paint"
          >
            <MenuGlyph open={menuOpen} />
            <span className="sheet-code hidden sm:block">{menuOpen ? dict.common.close : dict.common.menu}</span>
            <span className="sr-only sm:hidden">{menuOpen ? dict.common.close : dict.common.menu}</span>
          </button>
        </div>

        {/* --- Centre: the masthead ---------------------------------------- */}
        <Link
          href={localePath(locale, '/')}
          className="tap flex items-center justify-center gap-2.5 px-2 group"
          aria-label={brand.businessName[locale]}
        >
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" width={28} height={28} className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <PhoenixMark />
          )}
          <div className="flex items-center gap-2">
            <span className="display-wide whitespace-nowrap text-[0.95rem] font-700 uppercase tracking-[0.28em] text-ink group-hover:text-paint transition-colors duration-200">
              {brand.wordmark}
            </span>
            <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-0.5 text-[0.6rem] font-mono text-accent-gold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-signal animate-pulse" />
              3D SHOWROOM
            </span>
          </div>
        </Link>

        {/* --- Right: language and the lead path --------------------------- */}
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={localePath(otherLocale, current)}
            hrefLang={otherLocale}
            className="tap flex items-center rounded-lg px-2.5 text-[0.8rem] text-ink-soft transition-colors hover:text-paint"
            aria-label={`${dict.common.language}: ${LOCALE_LABEL[otherLocale]}`}
          >
            {LOCALE_LABEL[otherLocale]}
          </Link>

          {/*
            The wrapper is not decoration. `Button`'s base sets `inline-flex`, and without
            tailwind-merge (see src/lib/utils.ts) a `hidden` passed through `className` no
            longer reliably beats it — the winner becomes stylesheet order, and on a 380px
            phone this button was spilling off the right edge. Hiding the WRAPPER cannot
            conflict with anything the button sets.
          */}
          <div className="hidden sm:block">
            <Button asChild variant="primary" size="md">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                {dict.common.whatsapp}
              </a>
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <m.div
            id="ph-site-menu"
            className="overflow-hidden border-t border-glass-border"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav aria-label={dict.common.menu} className="mx-auto max-w-page px-4 pt-2 sm:px-6">
              <ul className="lg:grid lg:grid-cols-2 lg:gap-x-12">
                {[...PRIMARY_NAV, { href: '/contact', key: 'contact' as const }].map((item, index) => (
                  <li key={item.href} className="border-b border-rule-faint last:border-b-0 lg:last:border-b">
                    <Link
                      href={localePath(locale, item.href)}
                      className="tap group flex items-baseline gap-4 py-3.5"
                      aria-current={current === item.href ? 'page' : undefined}
                    >
                      <span className="sheet-code sheet-code-accent w-10 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-lg transition-colors group-hover:text-paint">{dict.nav[item.key]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mx-auto max-w-page px-4 py-5 sm:px-6">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
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
 * The default wordmark glyph — a stylised phoenix wing cut from two arcs. Drawn inline so it
 * inherits the accent and costs no request; a prospect's own `logoUrl` replaces it entirely.
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
        fill="var(--ph-accent)"
      />
    </svg>
  );
}

/** Two rules that become an X. Drawn, not imported — this is the only icon in the header. */
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
