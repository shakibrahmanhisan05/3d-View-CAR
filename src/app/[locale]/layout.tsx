/**
 * ROOT LAYOUT.
 *
 * There is deliberately no `app/layout.tsx`. The locale must be a route segment so that
 * `<html lang>` is correct and both locales are statically generated — and Next allows the
 * root layout to live inside a dynamic segment as long as every route sits under it.
 *
 * Site chrome (header/footer) is NOT here. It lives in `(site)/layout.tsx`, because
 * `/for/[slug]` replaces the chrome entirely with the prospect's (§10) and `/pitch` has no
 * chrome at all (§11).
 */

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { BrandProvider, PHOENIX_BRAND } from '@/components/brand/BrandProvider';
import { DictionaryProvider } from '@/components/i18n/DictionaryProvider';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { fontVariables } from '@/lib/fonts';
import { getDictionary } from '@/lib/i18n';
import { HTML_LANG, isLocale, LOCALES } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/types';
import '../globals.css';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#f7f5f0',
  // The configurator is a drag surface; a double-tap zoom in the middle of a colour change
  // is the difference between "impressive" and "broken" in a live pitch.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${dict.common.brand} — ${dict.common.tagline}`,
      template: `%s · ${dict.common.brand}`,
    },
    description: dict.hero.sub,
    alternates: {
      canonical: locale === 'bn' ? '/' : '/en',
      languages: { 'bn-BD': '/', 'en-GB': '/en' },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'bn' ? 'bn_BD' : 'en_GB',
      siteName: dict.common.brand,
      title: dict.hero.title,
      description: dict.hero.sub,
    },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return (
    <html lang={HTML_LANG[locale]} className={fontVariables}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <DictionaryProvider locale={locale} dict={dict}>
          <BrandProvider brand={PHOENIX_BRAND}>
            <MotionProvider>{children}</MotionProvider>
          </BrandProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
