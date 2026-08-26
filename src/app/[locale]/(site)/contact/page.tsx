import type { Metadata } from 'next';
import { DirectCard } from '@/components/contact/DirectCard';
import { LeadForm } from '@/components/contact/LeadForm';
import { Seal } from '@/components/frame/StageChrome';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return { title: dict.nav.contact, description: dict.contact.sub };
}

/**
 * Contact — THE ENVELOPE (§11).
 *
 * It was a form on the left and a phone number stacked on the right, both floating on the
 * page ground. It is now a single plate with a hairline rule down the middle: the form on one
 * side, a stamped contact block on the other, and a `FORM-A / LEAD-INTAKE` seal struck into
 * the corner — the same object as the ROI ledger's stamp and the 360° viewer's auction grade.
 *
 * A dealer who has spent twenty years signing paperwork recognises this shape before he reads
 * a word of it, and that recognition is the entire argument for the auction-sheet language the
 * whole site is built in.
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <Section code={dict.contact.code} label={dict.nav.contact} title={dict.contact.title} sub={dict.contact.sub}>
      <div className="plate lit-edge relative overflow-hidden">
        {/*
          The stamp sits at the FOOT of the sheet, not its head — which is where a stamp goes
          on a real form, and it keeps the 64px disc clear of the phone number, which is the
          widest single line in the right column.
        */}
        <div className="absolute bottom-5 right-5 z-10 hidden sm:block">
          <Seal size={64} tone="accent" title={dict.common.stampForm}>
            FORM
            <br />A
          </Seal>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_1px_22rem]">
          {/* --- Left: the form ------------------------------------------- */}
          <div className="p-6 sm:p-9">
            <span className="overline mb-6">LEAD-INTAKE</span>
            <LeadForm source="/contact" tone="bare" />
          </div>

          {/* The hairline rule down the middle of the envelope. */}
          <div aria-hidden="true" className="hidden bg-plate-border lg:block" />

          {/* --- Right: the contact card, pulled off the auction sheet ------ */}
          <aside className="border-t border-plate-border p-6 sm:p-9 lg:border-t-0">
            <DirectCard />
          </aside>
        </div>
      </div>
    </Section>
  );
}
