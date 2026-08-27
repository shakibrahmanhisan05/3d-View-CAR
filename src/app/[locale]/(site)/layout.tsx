/**
 * Phoenix site chrome layout.
 */

import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
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

  return (
    <>
      <LocalBusinessJsonLd locale={locale} />
      {children}
    </>
  );
}
