'use client';

/**
 * The right half of the contact envelope (§11) — the stamped DIRECT block.
 *
 * It is a client component for one reason: §1 locks "every WhatsApp href is built through
 * `whatsappUrl()` and reads `useBrand()`, never the module-level `PHOENIX_WHATSAPP`". A
 * server component cannot read the brand context, and hard-coding Phoenix's number here would
 * be the exact hole that rule exists to close — the day this block is reused on a prospect
 * surface, the lead would land on our phone instead of the owner's, in front of the owner.
 *
 * The phone number is set at `.stat-figure` size on purpose: it is one of the two facts on
 * this page, and it should be readable across a desk without anyone leaning in.
 */

import { useBrand } from '@/components/brand/BrandProvider';
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
import { Button } from '@/components/ui/button';
import { telUrl, whatsappUrl } from '@/lib/site';

export function DirectCard() {
  const dict = useDict();
  const locale = useLocale();
  const brand = useBrand();

  const waHref = whatsappUrl(
    brand.whatsapp,
    locale === 'bn'
      ? `আসসালামু আলাইকুম। ${brand.businessName[locale]}-এর ওয়েবসাইট নিয়ে কথা বলতে চাই।`
      : `Hello — I'd like to talk about a website for ${brand.businessName.en}.`,
  );

  return (
    <>
      <span className="overline">DIRECT</span>

      {/*
        Capped below the full stat scale. A Bangladeshi mobile is 14 characters with the
        country code, and 14 monospaced characters at 3.25rem is ~430px — half again wider
        than the 20rem column it lives in, so it ran straight off the edge of the envelope.
      */}
      <p className="mt-4">
        <a
          href={telUrl(brand.phone)}
          className="stat-figure block text-ink transition-colors hover:text-paint"
          style={{ fontSize: 'clamp(1.1rem, 1.9vw, 1.55rem)' }}
        >
          {brand.phone}
        </a>
      </p>
      <span className="stat-label">{dict.common.callUs}</span>

      <p className="mt-8 max-w-xs leading-relaxed text-ink-soft">{brand.address[locale]}</p>

      {/* Mirrors the form's submit button — every lead path ends in WhatsApp. */}
      <Button asChild variant="primary" size="lg" className="mt-8 w-full">
        <a href={waHref} target="_blank" rel="noopener noreferrer">
          {dict.common.whatsapp}
        </a>
      </Button>

      <p className="mt-6 text-xs leading-relaxed text-alu">{dict.contact.privacy}</p>
    </>
  );
}
