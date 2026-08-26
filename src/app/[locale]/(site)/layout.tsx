/**
 * Phoenix site chrome. Everything under `(site)` gets the header, the skip link and the
 * footer with the asset-credits modal.
 *
 * `/for/[slug]` and `/pitch` sit OUTSIDE this group on purpose — one replaces the chrome
 * with the prospect's, the other has none at all.
 */

import { Footer } from '@/components/chrome/Footer';
import { Header } from '@/components/chrome/Header';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { getCredits } from '@/lib/credits';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  // Read once on the server; the modal is client-side but the data never needs fetching.
  const credits = getCredits();

  return (
    <>
      <LocalBusinessJsonLd locale={locale} />
      <a href="#main" className="skip-link">
        {dict.common.skipToContent}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer credits={credits} />
    </>
  );
}
