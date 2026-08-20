/**
 * Home — the demo IS the hero (§4).
 *
 * Section 1 is the hero; sections 2–8 live in <SiteExperience>, shared verbatim with
 * `/for/[slug]`; section 9 is the footer, which comes from the (site) layout.
 */

import { notFound } from 'next/navigation';
import { Hero } from '@/components/home/Hero';
import { SiteExperience } from '@/components/home/SiteExperience';
import { FaqJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { isLocale } from '@/lib/i18n/config';
import { getCaptures, getVehicle, getVehicleBySegment } from '@/lib/vehicles';
import type { Locale } from '@/lib/types';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';

  const car = getVehicleBySegment('car');
  const bike = getVehicleBySegment('motorcycle');
  const modification = getVehicle('sedan-modified');
  const capture = getCaptures()[0];
  if (!car || !bike || !modification || !capture) notFound();

  return (
    <>
      <FaqJsonLd locale={locale} />
      <Hero car={car} bike={bike} />
      <SiteExperience locale={locale} car={car} bike={bike} modification={modification} capture={capture} />
    </>
  );
}
