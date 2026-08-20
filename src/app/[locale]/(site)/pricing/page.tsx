import type { Metadata } from 'next';
import { Faq } from '@/components/home/Faq';
import { PricingTable } from '@/components/home/PricingTable';
import dynamic from 'next/dynamic';
// Below the fold on every page that uses it, and it is the heaviest island after the 3D.
// No `ssr: false`: the markup still renders on the server, only the JS is split.
const RoiCalculator = dynamic(() => import('@/components/roi/RoiCalculator').then((m) => m.RoiCalculator));
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');
  return { title: dict.pricingSection.title, description: dict.pricingSection.oneTimeNote };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const dict = getDictionary(locale);

  return (
    <>
      <Section
        code={dict.pricingSection.code}
        label={dict.pricingSection.label}
        title={dict.pricingSection.title}
        sub={dict.pricingSection.sub}
      >
        <PricingTable locale={locale} />
      </Section>

      {/* §9 puts the calculator on / and /pricing both — it is what turns a number into a decision. */}
      <Section code={dict.roi.code} label={dict.roi.label} title={dict.roi.title} sub={dict.roi.sub} tone="sunk">
        <RoiCalculator />
      </Section>

      <Section code={dict.faq.code} label={dict.faq.label} title={dict.faq.title}>
        <Faq />
      </Section>
    </>
  );
}
