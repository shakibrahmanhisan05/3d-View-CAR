/**
 * JSON-LD `LocalBusiness` (§15 Phase 10).
 *
 * Phoenix sells to businesses inside one city, so local search is the only organic channel
 * that matters. The address and phone are the load-bearing fields; once Hisan supplies the
 * real street address (see PROJECT-STATE §10) this becomes eligible for a knowledge panel.
 *
 * Prices are published as an `offerCatalog` because §4.7 already puts them on the page —
 * withholding them from the structured data while showing them to humans would be odd.
 */

import { getDictionary } from '@/lib/i18n';
import { PHOENIX_ADDRESS, PHOENIX_PHONE, PRICING, SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/types';

export function LocalBusinessJsonLd({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#phoenix`,
    name: dict.common.brand,
    alternateName: 'Phoenix',
    description: dict.common.tagline,
    url: SITE_URL,
    telephone: PHOENIX_PHONE,
    inLanguage: ['bn', 'en'],
    priceRange: `৳${PRICING.capture360.from}–৳${PRICING.showroomSite.to}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chattogram',
      addressRegion: 'Chattogram Division',
      addressCountry: 'BD',
      streetAddress: PHOENIX_ADDRESS.en,
    },
    areaServed: { '@type': 'City', name: 'Chattogram' },
    knowsLanguage: ['bn-BD', 'en-GB'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: dict.pricingSection.title,
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: dict.pricingSection.p1Name, description: dict.pricingSection.p1Body },
          priceCurrency: 'BDT',
          price: PRICING.showroomSite.from,
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: dict.pricingSection.p2Name, description: dict.pricingSection.p2Body },
          priceCurrency: 'BDT',
          price: PRICING.configurator.from,
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: dict.pricingSection.p3Name, description: dict.pricingSection.p3Body },
          priceCurrency: 'BDT',
          price: PRICING.capture360.from,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      // The payload is built entirely from our own dictionary and config — no user input ever
      // reaches it, which is what makes this safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** FAQPage markup, generated from the same questions the page renders (§4.8). */
export function FaqJsonLd({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
