/**
 * The full site experience, sections 2–8.
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
import { DemoTabs } from '@/components/home/DemoTabs';
import { Arrow } from '@/components/frame/StageChrome';
import { Reveal, RevealGroup, RevealItem, RevealX } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
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
  const problems = dict.problems.lines;
  /* The anchor of §2 is the LAST line — the one about the buyer suspecting hidden damage. */
  const pullQuote = problems[problems.length - 1] ?? '';

  return (
    <>
      {/* ================= 2 — The problem, in their words ================= */}
      <Section id="problems" label={dict.problems.label} title={dict.problems.title}>
        <div className="grid min-w-0 gap-12 lg:grid-cols-12 lg:gap-16">
          {/*
            The anchor: the dealer's own sentence, set at headline scale. It arrives from the
            right — the only horizontal reveal on the site — so a scanning eye stops here.
          */}
          <div className="min-w-0 overflow-x-clip lg:col-span-5">
            <RevealX>
              <p className="display max-w-xl text-[clamp(1.8rem,3.4vw,3.25rem)] font-700 leading-[1.14] text-ink">
                “{pullQuote}”
              </p>
              <p className="mt-6 text-sm font-600 text-alu">{dict.problems.quoteSource}</p>
            </RevealX>
          </div>

          {/* The other objections, as quiet ruled rows. */}
          <RevealGroup className="min-w-0 lg:col-span-7" as="ul">
            {problems.map((line, index) => (
              <RevealItem
                key={line}
                as="li"
                className="group relative flex gap-5 border-b border-rule-faint py-6 pl-5 first:border-t"
              >
                {/* A drawn bar rather than a border utility: it has to change WIDTH on hover. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-6 left-0 w-0.5 bg-rule-strong transition-[width,background-color] duration-300 group-hover:w-1 group-hover:bg-signal"
                />
                <span className="sheet-code shrink-0 pt-1.5">{String(index + 1).padStart(2, '0')}</span>
                <p className="text-lg leading-snug sm:text-xl">{line}</p>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Outside the list: a <div> inside a <ul> is invalid, and the footnote is prose. */}
          <Reveal className="lg:col-span-7 lg:col-start-6">
            <p className="max-w-2xl leading-relaxed text-ink-soft">{dict.problems.footnote}</p>
          </Reveal>
        </div>
      </Section>

      {/* ================= 3 — Segmented live demos ======================== */}
      <Section id="demos" label={dict.demos.label} title={dict.demos.title} sub={dict.demos.sub} tone="sunk">
        <DemoTabs car={car} bike={bike} modification={modification} capture={capture} />
      </Section>

      {/* ================= 4 — The two-product explainer =================== */}
      <Section id="products" label={dict.twoProducts.label} title={dict.twoProducts.title} sub={dict.twoProducts.sub}>
        {/*
          Two panels, one shared rule. An eye crossing the page reads "there are exactly two
          things here" before it reads a word — that is this section's whole job.
        */}
        <RevealGroup className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-0">
          <ProductPanel
            code="A"
            tone="signal"
            title={dict.twoProducts.newTitle}
            answer={dict.twoProducts.newAnswer}
            body={dict.twoProducts.newBody}
            who={dict.twoProducts.newFor}
            href={localePath(locale, '/demo/bike')}
            cta={dict.demos.openFull}
            className="lg:pr-12"
          />

          <div aria-hidden="true" className="rule-v hidden lg:block" />

          {/*
            B takes bronze — the quieter of the two marks for the higher-margin product.
            No "most popular" badge anywhere near a price, ever.
          */}
          <ProductPanel
            code="B"
            tone="bronze"
            title={dict.twoProducts.reconTitle}
            answer={dict.twoProducts.reconAnswer}
            body={dict.twoProducts.reconBody}
            who={dict.twoProducts.reconFor}
            href={localePath(locale, '/demo/360')}
            cta={dict.demos.openFull}
            className="lg:pl-12"
          />
        </RevealGroup>

        <Reveal>
          <p className="mt-12 max-w-2xl border-l-2 border-rule-strong pl-5 text-sm leading-relaxed text-ink-soft">
            {dict.twoProducts.honest}
          </p>
        </Reveal>
      </Section>

      {/* ================= 5 — ROI ========================================= */}
      <Section id="roi" label={dict.roi.label} title={dict.roi.title} sub={dict.roi.sub} tone="sunk">
        {/*
          The one section that is a DOCUMENT rather than prose — an opaque card with real
          hairlines, filled in live with the owner's own numbers while he watches.
        */}
        <div className="plate lit-edge overflow-hidden p-5 shadow-elev-sm sm:p-8">
          <RoiCalculator />
        </div>
      </Section>

      {/* ================= 6 — Case study: reserved space ================== */}
      {showCaseStudy ? (
        <Section id="case" label={dict.caseStudy.label} title={dict.caseStudy.title}>
          <Reveal>
            {/*
              Nothing here should read as a broken card. It reads as RESERVED SPACE until the
              week-3 flagship client exists — dealers understand paperwork that has not been
              filled in yet; they do not understand an empty card.
            */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-rule-strong bg-paper p-7 sm:p-12">
              <span className="sheet-code absolute right-6 top-6">CS-00 · {dict.common.stampPending.toUpperCase()}</span>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <p className="display max-w-2xl text-[clamp(1.65rem,3vw,2.75rem)] font-700 leading-[1.15]">
                    {dict.caseStudy.pendingTitle}
                  </p>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">{dict.caseStudy.pendingBody}</p>
                </div>

                <Button asChild variant="primary" size="lg" className="shrink-0 self-start lg:self-auto">
                  <Link href={localePath(locale, '/contact')}>{dict.caseStudy.pendingCta}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Section>
      ) : null}

      {/* ================= 7 — Pricing ===================================== */}
      {showPricing ? (
        <Section id="pricing" label={dict.pricingSection.label} title={dict.pricingSection.title} sub={dict.pricingSection.sub} tone="sunk">
          <PricingTable locale={locale} />
        </Section>
      ) : null}

      {/* ================= 8 — FAQ ========================================= */}
      <Section id="faq" label={dict.faq.label} title={dict.faq.title}>
        <Faq />
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ProductPanel({
  code,
  tone,
  title,
  answer,
  body,
  who,
  href,
  cta,
  className,
}: {
  code: string;
  tone: 'signal' | 'bronze';
  title: string;
  answer: string;
  body: string;
  who: string;
  href: string;
  cta: string;
  className?: string;
}) {
  return (
    <RevealItem className={className}>
      <div className="flex h-full flex-col">
        <span
          aria-hidden="true"
          lang="en"
          className="display select-none text-[clamp(4.5rem,9vw,8rem)] font-800 leading-none"
          style={{ color: tone === 'signal' ? 'var(--ph-paint-lit)' : 'var(--ph-accent)' }}
        >
          {code}
        </span>

        <h3 className="mt-7 text-lg font-600">{title}</h3>
        <p className="display mt-2 text-[1.55rem] font-700 sm:text-3xl">{answer}</p>
        <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{body}</p>
        <p className="sheet-code mt-6">{who}</p>

        <Button asChild variant="outline" size="md" className="mt-5 rounded-full self-start">
          <Link href={href}>
            {cta}
            <Arrow />
          </Link>
        </Button>
      </div>
    </RevealItem>
  );
}
