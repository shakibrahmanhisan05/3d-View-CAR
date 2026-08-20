/**
 * Locale rewrite (§2).
 *
 * Bangla is the default and it keeps clean URLs. `/pricing` is REWRITTEN — not redirected —
 * to `/bn/pricing`, so:
 *   - the address bar stays clean for the Bangla-reading majority
 *   - `<html lang>` is still correct, because the route segment still carries the locale
 *   - both locales are still fully statically generated
 *
 * English is explicit at `/en/*`. There is no accept-language sniffing: a Chattogram dealer
 * whose phone is set to English still wants the Bangla site, and guessing wrong on the first
 * paint is worse than not guessing at all.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n/config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /**
   * Everything except Next internals, API routes, /admin, and any path with a file extension.
   *
   * `/admin` is excluded because it is an internal tool with its own root layout and no locale
   * segment — rewriting it to `/bn/admin` would 404. The extension check keeps `/sw.js`,
   * `/manifest.webmanifest` and the 360° frames out of the rewrite.
   */
  matcher: ['/((?!_next/|api/|admin|.*\\.[\\w]+$).*)'],
};
