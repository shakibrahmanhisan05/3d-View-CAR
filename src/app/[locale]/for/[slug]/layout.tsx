/**
 * `/for/[slug]` — THE HIGHEST-VALUE ROUTE ON THE SITE (§10).
 *
 * Our entire go-to-market is: walk into a showroom, offer to build their bestselling model in
 * 3D free, deliver in three days, then ask for the deal. That only works if producing a
 * bespoke demo takes under an hour — so this route substitutes the prospect's name, logo,
 * accent, phone and vehicles throughout, from ONE JSON file and nothing else.
 *
 * It sits outside the `(site)` route group because it replaces the chrome entirely: their
 * header, their footer, their WhatsApp number on every CTA. The owner watches a real lead
 * land on his own phone during the meeting, and that moment closes deals.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandProvider } from '@/components/brand/BrandProvider';
import { brandFromProspect } from '@/lib/brand';
import { ProspectChrome } from '@/components/prospect/ProspectChrome';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { getProspect, getProspects } from '@/lib/vehicles';
import type { Locale } from '@/lib/types';

export function generateStaticParams() {
  return getProspects().map((prospect) => ({ slug: prospect.slug }));
}

/** A 3- or 6-digit hex, or Phoenix ember. Nothing else is allowed near a <style> element. */
function safeHex(value: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : '#c8382a';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const prospect = getProspect(slug);
  if (!prospect) return {};

  return {
    title: prospect.businessName[locale],
    // §10: noindex, nofollow on all /for/*. Also enforced as a header in next.config.ts, so
    // a crawler that ignores the meta tag still gets told.
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function ProspectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'bn';
  const prospect = getProspect(slug);
  if (!prospect) notFound();

  const dict = getDictionary(locale);
  const brand = brandFromProspect(prospect);

  return (
    <BrandProvider brand={brand}>
      {/*
        ONE VARIABLE RETINTS THE WHOLE SITE.
        This is the entire reason the token layer is CSS custom properties rather than
        hard-coded Tailwind classes (§10). Every `bg-signal`, `text-signal` and `border-signal`
        in every shared component picks this up with no prop threading and no re-theming pass.
      */}
      {/*
        `signal-scope` is not optional decoration: it re-derives --ph-signal-lit / -sunk /
        the glow against THIS element's accent. Without it those tokens keep the value they
        were given on :root and the prospect's page shows Phoenix red. See globals.css.
      */}
      {/*
        The plume is painted by `body::before`, which sits ABOVE this subtree — so a scoped
        override alone leaves the room's backdrop lit in Phoenix red while everything inside it
        goes navy. §15 requires the plume's ember layer to retint with the rest, so the accent
        is also pushed onto :root.

        The value is re-parsed as a hex first. `brandAccent` is authored JSON rather than user
        input, but it lands inside a <style> element, and "it is our own data" is exactly the
        assumption that makes a CSS injection possible two years from now when the field is
        wired to an admin form.
      */}
      <style>{`:root{--ph-signal:${safeHex(prospect.brandAccent)}}`}</style>

      <div className="signal-scope" style={{ ['--ph-signal' as string]: prospect.brandAccent }}>
        <a href="#main" className="skip-link">
          {dict.common.skipToContent}
        </a>
        <ProspectChrome locale={locale} prospect={prospect}>
          {children}
        </ProspectChrome>
      </div>
    </BrandProvider>
  );
}
