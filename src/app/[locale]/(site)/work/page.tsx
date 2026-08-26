import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow, Seal } from '@/components/frame/StageChrome';
import { Section } from '@/components/sheet/Section';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return { title: dict.work.title, description: dict.work.sub };
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <Section code={dict.work.code} label={dict.nav.work} title={dict.work.title} sub={dict.work.sub}>
      {/*
        Deliberately empty until the week-3 flagship client exists. §17 forbids lorem ipsum,
        and an invented case study is worse than lorem ipsum — it is the exact thing that
        makes a dealer who has been burned before stop listening.
      */}
      {/*
        The same sealed-empty-plate treatment as §6 on the homepage: a dashed champagne
        outline on sunk paper with a real pending code. It must read as RESERVED SPACE, not
        as a card that failed to load — the last flat pre-Obsidian surface on a public route.
      */}
      <div className="relative max-w-3xl overflow-hidden rounded-2xl border-2 border-dashed border-rule-strong bg-paper p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <span className="sheet-code">CS-00 · {dict.common.stampPending.toUpperCase()}</span>
          <Seal size={52} tone="accent" title={dict.common.stampPending}>
            CS
            <br />
            00
          </Seal>
        </div>

        <p className="display display-lit mt-8 text-[clamp(1.5rem,3vw,2.5rem)] font-700 leading-[1.12]">
          {dict.caseStudy.pendingTitle}
        </p>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">{dict.work.empty}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{dict.caseStudy.pendingBody}</p>

        <Button asChild variant="primary" size="lg" className="mt-8">
          <Link href={localePath(locale, '/contact')}>{dict.caseStudy.pendingCta}</Link>
        </Button>
      </div>

      {/* Until there is client work, the demos ARE the portfolio. Say so, and link them. */}
      <ul className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { href: '/demo/car', label: dict.nav.demoCar, code: 'D-01' },
          { href: '/demo/bike', label: dict.nav.demoBike, code: 'D-02' },
          { href: '/demo/360', label: dict.nav.demo360, code: 'D-03' },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={localePath(locale, item.href)}
              className="surface lit-edge lift group flex items-baseline justify-between gap-3 p-5"
            >
              <span>
                <span className="sheet-code sheet-code-accent">{item.code}</span>
                <span className="mt-2 block text-base font-600">{item.label}</span>
              </span>
              <Arrow className="shrink-0 text-alu transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
