/**
 * /pitch — offline presentation mode (§11).
 *
 * Sits outside the `(site)` route group: no header, no footer, no scroll. It is a full-screen
 * deck for a tablet held out toward the owner.
 *
 * `?for=<slug>` runs the deck under a prospect's brand and vehicles, so the same two-hour
 * build covers "show them the Phoenix demo" and "show them their own".
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandProvider } from '@/components/brand/BrandProvider';
import { PitchDeck } from '@/components/pitch/PitchDeck';
import { brandFromProspect, PHOENIX_BRAND } from '@/lib/brand';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config';
import { getCaptures, getProspect, getVehicle, getVehicleBySegment } from '@/lib/vehicles';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  // Never indexed: it is an internal sales tool, not a page anyone should find.
  return { title: dict.pitch.title, robots: { index: false, follow: false } };
}

export default async function PitchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { locale: raw } = await params;
  const { for: slug } = await searchParams;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  const prospect = slug ? getProspect(slug) : undefined;
  const brand = prospect ? brandFromProspect(prospect) : PHOENIX_BRAND;

  const car =
    (prospect ? prospect.vehicleIds.map(getVehicle).find((v) => v?.segment === 'car') : undefined) ??
    getVehicleBySegment('car');
  const bike =
    (prospect ? prospect.vehicleIds.map(getVehicle).find((v) => v?.segment === 'motorcycle') : undefined) ??
    getVehicleBySegment('motorcycle');
  const capture = getCaptures()[0];

  if (!car || !bike || !capture) notFound();

  /*
   * The routes the deck warms. These are the pages a meeting can jump to from the deck, so
   * they have to survive the network being off too — not just the deck itself.
   */
  const routes = [
    localePath(locale, '/'),
    localePath(locale, '/demo/car'),
    localePath(locale, '/demo/bike'),
    localePath(locale, '/demo/360'),
    localePath(locale, '/pricing'),
    ...(prospect ? [localePath(locale, `/for/${prospect.slug}`)] : []),
  ];

  return (
    <BrandProvider brand={brand}>
      <PitchDeck car={car} bike={bike} capture={capture} routes={routes} />
    </BrandProvider>
  );
}
