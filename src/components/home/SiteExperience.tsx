/**
 * The full site experience, sections 2–8 of §4.
 *
 * Shared verbatim by `/` and by `/for/[slug]`. §10 requires a prospect demo to feel like
 * THEIR website, not a Phoenix page with a logo pasted on — which only holds if the prospect
 * route renders the same sections, with the same weight, rather than a cut-down version.
 *
 * Everything that differs between the two is either data (`car`, `bike`, `capture`) or comes
 * from <BrandProvider> and the `--ph-signal` override. There is no `isProspect` branching
 * inside these sections, and there must not be.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DemoTabs } from '@/components/home/DemoTabs';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Faq } from '@/components/home/Faq';
import { PricingTable } from '@/components/home/PricingTable';
import dynamic from 'next/dynamic';
// Below the fold on every page that uses it, and it is the heaviest island after the 3D.
// No `ssr: false`: the markup still renders on the server, only the JS is split.
const RoiCalculator = dynamic(() => import('@/components/roi/RoiCalculator').then((m) => m.RoiCalculator));
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/config';
import type { Capture360, Locale, Vehicle } from '@/lib/types';

export function SiteExperience({
  locale,
  car,
  bike,
  modification,
  capture,
  showPricing = true,
  showCaseStudy = true,
}: {
  locale: Locale;
  car: Vehicle;
  bike: Vehicle;
  modification: Vehicle;
  capture: Capture360;
  showPricing?: boolean;
  showCaseStudy?: boolean;
}) {
  const dict = getDictionary(locale);

  return (
    <>
      {/* 2 — The problem, in their words */}
      <Section code={dict.problems.code} label={dict.problems.label} title={dict.problems.title}>
        <RevealGroup className="max-w-3xl" as="ul">
          {dict.problems.lines.map((line, index) => (
            <RevealItem
              key={line}
              as="li"
              className="group flex gap-6 border-b border-rule-faint py-7 first:border-t first:border-t-glass-border-lit"
            >
              <span className="sheet-code sheet-code-accent pt-2.5">{String(index + 1).padStart(2, '0')}</span>
              <p className="text-xl leading-snug transition-colors duration-300 sm:text-2xl">{line}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal>
          <p className="mt-10 max-w-2xl leading-relaxed text-ink-soft">{dict.problems.footnote}</p>
        </Reveal>
      </Section>

      {/* 3 — Segmented live demos, one WebGL context */}
      <Section
        code={dict.demos.code}
        label={dict.demos.label}
        title={dict.demos.title}
        sub={dict.demos.sub}
        tone="sunk"
      >
        <DemoTabs car={car} bike={bike} modification={modification} capture={capture} />
      </Section>

      {/* 4 — The two-product explainer: the clearest section on the site */}
      <Section
        code={dict.twoProducts.code}
        label={dict.twoProducts.label}
        title={dict.twoProducts.title}
        sub={dict.twoProducts.sub}
      >
        <RevealGroup className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: dict.twoProducts.newTitle,
              answer: dict.twoProducts.newAnswer,
              body: dict.twoProducts.newBody,
              who: dict.twoProducts.newFor,
              href: '/demo/bike',
              code: 'A',
            },
            {
              title: dict.twoProducts.reconTitle,
              answer: dict.twoProducts.reconAnswer,
              body: dict.twoProducts.reconBody,
              who: dict.twoProducts.reconFor,
              href: '/demo/360',
              code: 'B',
            },
          ].map((item) => (
            <RevealItem key={item.code}>
              <Card interactive className="group flex h-full flex-col p-7 sm:p-8">
                <span className="sheet-code sheet-code-accent">{item.code}</span>
                <h3 className="mt-4 text-lg font-600">{item.title}</h3>
                <p className="display mt-2.5 text-2xl font-700 text-signal-lit sm:text-3xl">{item.answer}</p>
                <p className="mt-5 flex-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                <p className="sheet-code mt-7">{item.who}</p>
                <Link
                  href={localePath(locale, item.href)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-600 text-ink transition-colors hover:text-accent-gold"
                >
                  {dict.demos.openFull}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal>
          <p className="mt-8 max-w-2xl border-l-2 border-accent-gold pl-5 text-sm leading-relaxed text-ink-soft">
            {dict.twoProducts.honest}
          </p>
        </Reveal>
      </Section>

      {/* 5 — ROI calculator */}
      <Section
        code={dict.roi.code}
        label={dict.roi.label}
        title={dict.roi.title}
        sub={dict.roi.sub}
        tone="sunk"
        id="roi"
      >
        <RoiCalculator />
      </Section>

      {/* 6 — Case study. Empty on purpose until the week-3 flagship client exists. */}
      {showCaseStudy ? (
        <Section code={dict.caseStudy.code} label={dict.caseStudy.label} title={dict.caseStudy.title}>
          <Reveal>
            <Card className="max-w-2xl p-7 sm:p-9">
              <p className="display text-xl font-700">{dict.caseStudy.pendingTitle}</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{dict.caseStudy.pendingBody}</p>
              <Button asChild variant="primary" size="lg" className="mt-7">
                <Link href={localePath(locale, '/contact')}>{dict.caseStudy.pendingCta}</Link>
              </Button>
            </Card>
          </Reveal>
        </Section>
      ) : null}

      {/* 7 — Pricing */}
      {showPricing ? (
        <Section
          code={dict.pricingSection.code}
          label={dict.pricingSection.label}
          title={dict.pricingSection.title}
          sub={dict.pricingSection.sub}
          tone="sunk"
          id="pricing"
        >
          <PricingTable locale={locale} />
        </Section>
      ) : null}

      {/* 8 — FAQ */}
      <Section code={dict.faq.code} label={dict.faq.label} title={dict.faq.title}>
        <Faq />
      </Section>
    </>
  );
}
