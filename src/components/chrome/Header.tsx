'use client';

/**
 * Site header — frosted chrome over the dark floor.
 *
 * It starts transparent so the hero canvas runs edge to edge under it, and fuses into glass
 * once the page has moved. That transition is the only piece of scroll-linked styling on the
 * site: it is a boolean at a 8px threshold, not a scrubbed value, so it costs one class swap
 * rather than a paint per frame.
 *
 * The active-nav marker is a shared `layoutId` pill, so moving between routes slides the
 * marker rather than blinking it.
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

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || menuOpen ? 'glass border-b' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-header max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={localePath(locale, '/')}
          className="tap -mx-2 flex items-center gap-3 px-2"
          aria-label={brand.businessName[locale]}
        >
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- prospect logos are arbitrary
            // remote files; adding every dealer's host to next.config remotePatterns would
            // break the "edit exactly one JSON file" acceptance test (§10).
            <img src={brand.logoUrl} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <PhoenixMark />
          )}
          <span className="flex flex-col leading-none">
            <span className="display-wide text-[0.95rem] font-700 uppercase tracking-[0.24em] text-ink">
              {brand.wordmark}
            </span>
            <span className="sheet-code mt-1 hidden sm:block">{brand.gutterCode}</span>
          </span>
        </Link>

        <nav aria-label={dict.common.menu} className="hidden items-center gap-0.5 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = current === item.href;
            return (
              <Link
                key={item.href}
                href={localePath(locale, item.href)}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-lg px-3.5 py-2 text-[0.9rem] transition-colors duration-200 ${
                  active ? 'text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {active ? (
                  <m.span
                    layoutId={reduced ? undefined : 'ph-nav-active'}
                    className="absolute inset-0 -z-10 rounded-lg border border-glass-border bg-glass"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                {dict.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href={localePath(otherLocale, current)}
            hrefLang={otherLocale}
            className="tap flex items-center rounded-lg px-2.5 text-[0.8rem] text-ink-soft transition-colors hover:text-accent-gold"
            aria-label={`${dict.common.language}: ${LOCALE_LABEL[otherLocale]}`}
          >
            {LOCALE_LABEL[otherLocale]}
          </Link>

          <Button asChild variant="primary" size="md" className="hidden sm:inline-flex">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              {dict.common.whatsapp}
            </a>
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="ph-mobile-menu"
            className="tap flex items-center justify-center rounded-lg px-2 text-ink transition-colors hover:text-accent-gold lg:hidden"
          >
            <span className="sr-only">{menuOpen ? dict.common.close : dict.common.menu}</span>
            <MenuGlyph open={menuOpen} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <m.div
            id="ph-mobile-menu"
            className="overflow-hidden border-t border-glass-border lg:hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="mx-auto max-w-page px-4 pt-2 sm:px-6">
              {[...PRIMARY_NAV, { href: '/contact', key: 'contact' as const }].map((item, index) => (
                <li key={item.href} className="border-b border-rule-faint last:border-b-0">
                  <Link
                    href={localePath(locale, item.href)}
                    className="tap flex items-baseline gap-4 py-3.5"
                    aria-current={current === item.href ? 'page' : undefined}
                  >
                    <span className="sheet-code w-10 shrink-0 text-accent-gold">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg">{dict.nav[item.key]}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mx-auto max-w-page px-4 py-5 sm:px-6">
              <Button asChild variant="primary" size="lg" className="w-full">
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
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false" className="shrink-0">
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
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
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
