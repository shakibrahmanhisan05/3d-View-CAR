import type { Metadata } from 'next';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return { title: dict.process.title, description: dict.process.sub };
}

export default async function ProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);

  return (
    <>
      <Section code={dict.process.code} label={dict.nav.process} title={dict.process.title} sub={dict.process.sub}>
        {/*
          Six numbered steps with BOTH columns filled in. "What you have to do" is stated at
          every stage on purpose: the objection this page answers is not "how does it work",
          it is "how much of my time is this going to cost me".
        */}
        <ol className="border-t border-glass-border-lit">
          {dict.process.steps.map((step, index) => (
            <li key={step.title} className="grid gap-4 border-b border-rule py-7 lg:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_7rem]">
              <span className="sheet-code sheet-code-accent">STEP-{String(index + 1).padStart(2, '0')}</span>

              <div>
                <h2 className="text-lg font-600">{step.title}</h2>
                <p className="sheet-code mt-2">{dict.process.ourPart}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.ourPart}</p>
              </div>

              <div className="lg:pt-7">
                <p className="sheet-code">{dict.process.yourPart}</p>
                <p className="mt-1 text-sm leading-relaxed">{step.yourPart}</p>
              </div>

              <div className="lg:text-right lg:pt-7">
                <p className="sheet-code">{dict.process.duration}</p>
                <p className="num mt-1 text-sm">{step.duration}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section code="PAY" label={dict.process.paymentTitle} title={dict.process.paymentTitle} tone="sunk">
        <p className="max-w-2xl leading-relaxed text-ink-soft">{dict.process.paymentBody}</p>

        <h2 className="display mt-10 text-2xl font-700">{dict.process.ownershipTitle}</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{dict.process.ownershipBody}</p>
      </Section>
    </>
  );
}
