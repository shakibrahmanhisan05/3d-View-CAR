/**
 * Bilingual routing (§2, §16).
 *
 * Bangla is the DEFAULT and it gets the clean URLs: `/pricing`, not `/bn/pricing`. The
 * middleware rewrites `/pricing` → `/bn/pricing` internally, so `<html lang>` is still
 * correct and every page is still statically generated for both locales.
 *
 * English lives at `/en/*`.
 */

import type { Locale, Localized } from '@/lib/types';

export const LOCALES = ['bn', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'bn';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Build an href for the active locale. Bangla is prefix-free; English is prefixed.
 * `path` is always written in its canonical, prefix-free form: '/', '/pricing', '/demo/bike'.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean || '/' : `/en${clean}`;
}

/** Strip the locale prefix off a real pathname, giving back the canonical form. */
export function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname || '/';
}

export function pick(value: Localized, locale: Locale): string {
  return value[locale];
}

/** The `lang` attribute and the font stack both key off this. */
export const HTML_LANG: Record<Locale, string> = { bn: 'bn-BD', en: 'en-GB' };

export const LOCALE_LABEL: Record<Locale, string> = { bn: 'বাংলা', en: 'English' };

/**
 * Digits. Bangla numerals are NOT used for money or specs on this site: every dealer reads
 * ৳ figures in Western digits on his own invoices, auction sheets and BRTA papers, and a
 * price in Bangla numerals reads as decorative rather than as a real quote. Bangla numerals
 * are used only where the number is prose (e.g. "১৫ মিনিটের ডেমো").
 */
export const BDT = '৳';

/**
 * Bangladeshi digit grouping: 2,04,500 — not 204,500. Getting this wrong is the fastest way
 * to look foreign to the man reading the price.
 */
export function formatBDT(amount: number, withSymbol = true): string {
  const negative = amount < 0;
  const digits = Math.round(Math.abs(amount)).toString();

  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    grouped = `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
  }

  const sign = negative ? '−' : '';
  return withSymbol ? `${sign}${BDT} ${grouped}` : `${sign}${grouped}`;
}

/** Signed delta for option price lines: '+৳ 12,500' / '৳ 0'. */
export function formatDelta(amount: number): string {
  if (amount === 0) return `${BDT} 0`;
  return `${amount > 0 ? '+' : '−'}${BDT} ${formatBDT(Math.abs(amount), false)}`;
}
