import type { Metadata } from 'next';
import { LeadForm } from '@/components/contact/LeadForm';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { PHOENIX_ADDRESS, PHOENIX_PHONE, telUrl } from '@/lib/site';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');
  return { title: dict.nav.contact, description: dict.contact.sub };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const dict = getDictionary(locale);

  return (
    <Section code={dict.contact.code} label={dict.nav.contact} title={dict.contact.title} sub={dict.contact.sub}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <LeadForm source="/contact" />

        <aside>
          <p className="sheet-code">DIRECT</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <a href={telUrl(PHOENIX_PHONE)} className="num text-base hover:text-signal">
                {PHOENIX_PHONE}
              </a>
              <span className="block text-xs text-alu">{dict.common.callUs}</span>
            </li>
            <li className="text-ink-soft">{PHOENIX_ADDRESS[locale]}</li>
          </ul>
        </aside>
      </div>
    </Section>
  );
}
