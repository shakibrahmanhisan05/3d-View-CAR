import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { isLocale, localePath } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');
  return { title: dict.work.title, description: dict.work.sub };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const dict = getDictionary(locale);

  return (
    <Section code={dict.work.code} label={dict.nav.work} title={dict.work.title} sub={dict.work.sub}>
      {/*
        Deliberately empty until the week-3 flagship client exists. §17 forbids lorem ipsum,
        and an invented case study is worse than lorem ipsum — it is the exact thing that
        makes a dealer who has been burned before stop listening.
      */}
      <div className="max-w-2xl border border-rule bg-paper-raised p-6 sm:p-8">
        <p className="sheet-code">WIP</p>
        <p className="display mt-3 text-xl font-700">{dict.caseStudy.pendingTitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{dict.work.empty}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{dict.caseStudy.pendingBody}</p>

        <Link
          href={localePath(locale, '/contact')}
          className="tap mt-6 inline-flex items-center bg-signal px-5 py-3 text-sm font-600 text-signal-ink hover:brightness-110"
        >
          {dict.caseStudy.pendingCta}
        </Link>
      </div>

      {/* Until there is client work, the demos ARE the portfolio. Say so, and link them. */}
      <ul className="mt-10 grid gap-px bg-rule sm:grid-cols-3">
        {[
          { href: '/demo/car', label: dict.nav.demoCar, code: 'D-01' },
          { href: '/demo/bike', label: dict.nav.demoBike, code: 'D-02' },
          { href: '/demo/360', label: dict.nav.demo360, code: 'D-03' },
        ].map((item) => (
          <li key={item.href} className="bg-paper">
            <Link href={localePath(locale, item.href)} className="block p-5 hover:bg-paper-sunk">
              <span className="sheet-code">{item.code}</span>
              <span className="mt-2 block text-base font-600">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
