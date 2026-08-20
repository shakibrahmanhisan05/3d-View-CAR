/**
 * The prospect demo body (§10).
 *
 * Same hero, same sections, same weight as the Phoenix site — because §10 requires it to feel
 * like THEIR website, not a Phoenix page with a logo pasted on.
 *
 * The pricing section is dropped: a dealer looking at his own demo does not want to read our
 * price list on his own homepage. The case study is dropped for the same reason.
 */

import { notFound } from 'next/navigation';
import { Hero } from '@/components/home/Hero';
import { SiteExperience } from '@/components/home/SiteExperience';
import { Section } from '@/components/sheet/Section';
import { DeferredLeadForm } from '@/components/contact/DeferredLeadForm';
import { getDictionary } from '@/lib/i18n';
import { fill } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { getCaptures, getProspect, getVehicle, getVehicleBySegment } from '@/lib/vehicles';
import type { Locale, Vehicle } from '@/lib/types';

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const dict = getDictionary(locale);

  const prospect = getProspect(slug);
  if (!prospect) notFound();

  /*
   * The prospect's own vehicle list drives the demo. `heroVehicleId` decides which segment
   * opens first — a bike showroom must not land on a car, and getting that wrong in the first
   * second of a meeting undoes the whole point of the visit.
   */
  const chosen = prospect.vehicleIds
    .map((id) => getVehicle(id))
    .filter((vehicle): vehicle is Vehicle => Boolean(vehicle));

  const hero = getVehicle(prospect.heroVehicleId);
  const bike =
    chosen.find((vehicle) => vehicle.segment === 'motorcycle') ?? getVehicleBySegment('motorcycle');
  const car = chosen.find((vehicle) => vehicle.segment === 'car') ?? getVehicleBySegment('car');
  const modification = getVehicle('sedan-modified');
  const capture = getCaptures()[0];

  if (!car || !bike || !modification || !capture) notFound();

  return (
    <>
      <Hero
        car={hero?.segment === 'car' ? hero : car}
        bike={hero?.segment === 'motorcycle' ? hero : bike}
        initialSegment={prospect.segment === 'car' ? 'car' : 'bike'}
      />

      <SiteExperience
        locale={locale}
        car={car}
        bike={bike}
        modification={modification}
        capture={capture}
        showPricing={false}
        showCaseStudy={false}
      />

      <Section
        code={dict.contact.code}
        label={dict.nav.contact}
        title={fill(dict.prospect.builtFor, { name: prospect.businessName[locale] })}
        sub={dict.prospect.yourNumber}
      >
        <DeferredLeadForm source={`/for/${prospect.slug}`} />
      </Section>
    </>
  );
}
