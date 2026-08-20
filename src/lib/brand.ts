/**
 * Whose site is this?
 *
 * On the Phoenix site the answer is Phoenix. On /for/[slug] it is the prospect — his name,
 * his logo, his accent, HIS WhatsApp number on every CTA (§10).
 *
 * This module is deliberately NOT `'use client'`: the mapping is pure data and server
 * components (the prospect layout) have to call it. The React context that carries the result
 * lives in components/brand/BrandProvider.tsx.
 */

import { PHOENIX_ADDRESS, PHOENIX_PHONE, PHOENIX_WHATSAPP } from '@/lib/site';
import type { Localized, Prospect } from '@/lib/types';

export type Brand = {
  businessName: Localized;
  wordmark: string;
  /** The mono code printed under the wordmark — an auction-sheet reference, not decoration. */
  gutterCode: string;
  logoUrl?: string;
  whatsapp: string;
  phone: string;
  address: Localized;
  /** Overrides --ph-signal for the whole subtree. Undefined on the Phoenix site. */
  accent?: string;
  isProspect: boolean;
  expiresAt?: string;
};

export const PHOENIX_BRAND: Brand = {
  businessName: { bn: 'ফিনিক্স', en: 'Phoenix' },
  wordmark: 'PHOENIX',
  gutterCode: 'CTG / 3D',
  whatsapp: PHOENIX_WHATSAPP,
  phone: PHOENIX_PHONE,
  address: PHOENIX_ADDRESS,
  isProspect: false,
};

export function brandFromProspect(prospect: Prospect): Brand {
  return {
    businessName: prospect.businessName,
    wordmark: prospect.businessName.en.toUpperCase(),
    gutterCode: prospect.address.en,
    logoUrl: prospect.logoUrl,
    whatsapp: prospect.whatsapp,
    phone: prospect.phone,
    address: prospect.address,
    accent: prospect.brandAccent,
    isProspect: true,
    expiresAt: prospect.expiresAt,
  };
}
