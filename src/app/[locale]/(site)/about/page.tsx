import type { Metadata } from 'next';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return { title: dict.about.title, description: dict.about.sub };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);

  return (
    <>
      <Section code={dict.about.code} label={dict.nav.about} title={dict.about.title} sub={dict.about.sub}>
        <p className="max-w-2xl leading-relaxed">{dict.about.body}</p>

        {/* No stock photography, no headshots in circles. A roster, as a sheet. */}
        <ul className="mt-12 border-t border-ink">
          {dict.about.team.map((member, index) => (
            <li key={member.name} className="grid gap-3 border-b border-rule py-6 sm:grid-cols-[4rem_10rem_minmax(0,1fr)]">
              <span className="sheet-code">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-lg font-600 leading-tight">{member.name}</p>
                <p className="sheet-code mt-1">{member.role}</p>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{member.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/*
        §3 rejects "Elevate your…" copy, and the honest version of an about page for a studio
        with no track record is to say so. A dealer who has been sold a bad website before
        trusts this more than a fabricated client list.
      */}
      <Section code="HON" label={dict.about.honestTitle} title={dict.about.honestTitle} tone="sunk">
        <p className="max-w-2xl leading-relaxed text-ink-soft">{dict.about.honestBody}</p>
      </Section>
    </>
  );
}
