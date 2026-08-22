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
 *
 * REVISION 2 — ONE ARTEFACT PER SECTION
 * -------------------------------------
 * Every section used to be `gutter-code · h2 · sub · content` with the same 16px reveal.
 * Eight sections times one motion pattern is a slideshow, not a magazine. Each section below
 * now carries exactly ONE distinguishing heaviness — a pull-quote, a shelf, a monumental
 * letter, a ledger, a sealed empty plate, a size ladder, a row index — sized to be read from
 * three feet away. Nothing is a glass rectangle by default any more.
 */

import Link from 'next/link';
import { DemoTabs } from '@/components/home/DemoTabs';
import { Arrow, Seal } from '@/components/frame/StageChrome';
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
      <Section
        id="problems"
        code={dict.problems.code}
        label={dict.problems.label}
        title={dict.problems.title}
      >
        <div className="grid min-w-0 gap-10 lg:grid-cols-12 lg:gap-12">
          {/*
            The anchor. A pull-quote at 4rem arriving from the RIGHT — the only horizontal
            reveal on the site, so it is the one moment on the page an eye is forced to stop.
          */}
          {/*
            `overflow-x-clip`, not `overflow-hidden`. The reveal starts 40px to the right of
            its resting position, and on a 380px phone that pushed the whole document 24px
            sideways until the animation fired. Clipping the horizontal travel fixes it —
            and `clip` rather than `hidden` because the decorative `02` bleeds ABOVE this box
            and `overflow-hidden` would have cut it off along with the travel.
          */}
          <div className="min-w-0 overflow-x-clip lg:col-span-5">
            <RevealX className="relative">
              <span
                aria-hidden="true"
                className="monolith absolute -left-2 -top-8 select-none opacity-[0.06]"
                style={{ fontSize: 'clamp(6rem, 11vw, 11rem)' }}
              >
                02
              </span>
              <p className="relative display display-lit text-[clamp(2rem,4vw,4rem)] font-700 leading-[1.08]">
                {pullQuote}
              </p>
              <span className="overline mt-6">{dict.problems.code}</span>
          </RevealX>
          </div>

          {/* The list as ruled rows with a champagne bar that grows on hover. */}
          <RevealGroup className="min-w-0 lg:col-span-7" as="ul">
            {problems.map((line, index) => (
              <RevealItem
                key={line}
                as="li"
                className="group relative flex gap-5 border-b border-rule-faint py-7 pl-5 transition-transform duration-300 first:border-t first:border-t-glass-border-lit hover:-translate-y-1"
              >
                {/* A drawn bar rather than a border utility: it has to change WIDTH on hover. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-7 left-0 w-0.5 bg-accent-gold transition-[width] duration-300 group-hover:w-1"
                />
                <span className="sheet-code sheet-code-accent shrink-0 pt-2.5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-xl leading-snug">{line}</p>
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
      <Section
        id="demos"
        code={dict.demos.code}
        label={dict.demos.label}
        title={dict.demos.title}
        sub={dict.demos.sub}
        tone="sunk"
      >
        <DemoTabs car={car} bike={bike} modification={modification} capture={capture} />
      </Section>

      {/* ================= 4 — The two-product explainer =================== */}
      <Section
        id="products"
        code={dict.twoProducts.code}
        label={dict.twoProducts.label}
        title={dict.twoProducts.title}
        sub={dict.twoProducts.sub}
      >
        {/*
          Two split panels with a shared vertical rule, not two cards. The monumental A and B
          are the artefact: an eye crossing the page at speed reads "there are exactly two
          things here" before it reads a single word, which is the entire job of this section.
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
            className="lg:pr-10"
          />

          <div aria-hidden="true" className="rule-v hidden lg:block" />

          {/*
            B takes champagne rather than ember, deliberately reversing the accent order:
            §4B is the higher-margin product for Phoenix and the elegance layer signals it
            without a "most popular" badge anywhere near a price.
          */}
          <ProductPanel
            code="B"
            tone="accent"
            title={dict.twoProducts.reconTitle}
            answer={dict.twoProducts.reconAnswer}
            body={dict.twoProducts.reconBody}
            who={dict.twoProducts.reconFor}
            href={localePath(locale, '/demo/360')}
            cta={dict.demos.openFull}
            className="lg:pl-10"
          />
        </RevealGroup>

        <Reveal>
          <p className="mt-12 max-w-2xl border-l-2 border-accent-gold pl-5 text-sm leading-relaxed text-ink-soft">
            {dict.twoProducts.honest}
          </p>
        </Reveal>
      </Section>

      {/* ================= 5 — ROI, as a real ledger ======================= */}
      <Section
        id="roi"
        code={dict.roi.code}
        label={dict.roi.label}
        title={dict.roi.title}
        sub={dict.roi.sub}
        tone="sunk"
      >
        {/*
          The one section on the site that is a DOCUMENT rather than a stage, so it gets the
          plate treatment: opaque, flat, hairline-ruled, with a champagne ceiling strip. It
          should look like something that came out of a printer.
        */}
        <div className="plate lit-edge overflow-hidden p-5 sm:p-8">
          <RoiCalculator />
        </div>
      </Section>

      {/* ================= 6 — Case study: a sealed empty plate ============ */}
      {showCaseStudy ? (
        <Section id="case" code={dict.caseStudy.code} label={dict.caseStudy.label} title={dict.caseStudy.title}>
          <Reveal>
            {/*
              Nothing here should read as a broken card. It reads as RESERVED SPACE, filed and
              sealed until the week-3 flagship client exists — a dashed champagne outline on
              sunk paper with a real pending code in the corner. Dealers understand paperwork
              that has not been filled in yet; they do not understand an empty card.
            */}
            <div
              className="relative overflow-hidden rounded-xl bg-paper-sunk p-7 sm:p-12"
              style={{
                aspectRatio: 'auto',
                border: '2px dashed color-mix(in oklab, var(--ph-accent) 36%, transparent)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <span className="sheet-code sheet-code-accent">
                  CS-00 · {dict.common.stampPending.toUpperCase()}
                </span>
                <Seal size={52} tone="accent" title={dict.common.stampPending}>
                  CS
                  <br />
                  00
                </Seal>
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <p className="display display-lit max-w-2xl text-[clamp(1.75rem,3.2vw,3rem)] font-700 leading-[1.1]">
                    {dict.caseStudy.pendingTitle}
                  </p>
                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-soft">
                    {dict.caseStudy.pendingBody}
                  </p>
                </div>

                <Button asChild variant="primary" size="lg" className="shrink-0">
                  <Link href={localePath(locale, '/contact')}>{dict.caseStudy.pendingCta}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Section>
      ) : null}

      {/* ================= 7 — Pricing ===================================== */}
      {showPricing ? (
        <Section
          id="pricing"
          code={dict.pricingSection.code}
          label={dict.pricingSection.label}
          title={dict.pricingSection.title}
          sub={dict.pricingSection.sub}
          tone="sunk"
        >
          <PricingTable locale={locale} />
        </Section>
      ) : null}

      {/* ================= 8 — FAQ ========================================= */}
      <Section id="faq" code={dict.faq.code} label={dict.faq.label} title={dict.faq.title}>
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
  tone: 'signal' | 'accent';
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
          className="monolith select-none leading-none"
          style={{
            fontSize: 'clamp(6rem, 12vw, 12rem)',
            color: tone === 'signal' ? 'var(--ph-signal)' : 'var(--ph-accent)',
            textShadow: 'none',
            opacity: 0.9,
          }}
        >
          {code}
        </span>

        <h3 className="mt-6 text-lg font-600">{title}</h3>
        <p className="display mt-2.5 text-2xl font-700 text-paint sm:text-3xl">{answer}</p>
        <p className="mt-5 flex-1 text-sm leading-relaxed text-ink-soft">{body}</p>
        <p className="sheet-code mt-7">{who}</p>

        <Button asChild variant="plate" size="md" className="mt-5 self-start">
          <Link href={href}>
            {cta}
            <Arrow />
          </Link>
        </Button>
      </div>
    </RevealItem>
  );
}
