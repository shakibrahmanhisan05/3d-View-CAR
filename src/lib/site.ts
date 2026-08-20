/**
 * Single source of truth for Phoenix's own contact details, routes, and published prices.
 *
 * Everything here is overridable per prospect on /for/[slug] (§10) — a branded demo must
 * point every CTA at THAT owner's WhatsApp, so he watches a real lead land on his own phone
 * during the meeting. That is the moment that closes deals, and it only works if nothing in
 * the codebase hard-codes our number.
 */

import type { Locale, Localized } from '@/lib/types';

/** Digits only, country code included, no `+` and no spaces — wa.me will not accept them. */
export const PHOENIX_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '8801XXXXXXXXX';
export const PHOENIX_PHONE = process.env.NEXT_PUBLIC_PHONE ?? '+8801XXXXXXXXX';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** TODO(hisan): real street address — needed for the footer and the LocalBusiness JSON-LD. */
export const PHOENIX_ADDRESS: Localized = {
  bn: 'চট্টগ্রাম, বাংলাদেশ',
  en: 'Chattogram, Bangladesh',
};

export const PHOENIX_FACEBOOK = 'https://www.facebook.com/';

export type NavItem = { href: string; key: 'home' | 'demoCar' | 'demoBike' | 'demo360' | 'work' | 'pricing' | 'process' | 'about' | 'contact' };

/** Canonical, prefix-free paths. `localePath()` adds `/en` when needed. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/demo/car', key: 'demoCar' },
  { href: '/demo/bike', key: 'demoBike' },
  { href: '/demo/360', key: 'demo360' },
  { href: '/pricing', key: 'pricing' },
  { href: '/process', key: 'process' },
  { href: '/work', key: 'work' },
  { href: '/about', key: 'about' },
];

export const FOOTER_NAV: NavItem[] = [...PRIMARY_NAV, { href: '/contact', key: 'contact' }];

/**
 * Published prices (Playbook §2.2). All BDT, all one-time project pricing.
 *
 * The care plan is quoted ANNUALLY and marked optional. §16 forbids monthly SaaS pricing,
 * and a `৳1,500/month` line next to a project price reads as exactly that even though it is
 * maintenance. Same money, correct framing.
 */
export const PRICING = {
  showroomSite: { from: 45_000, to: 75_000 },
  configurator: { from: 25_000, to: 40_000 },
  capture360: { from: 1_200, to: 2_500 },
  carePlanYearly: 18_000,
  /** Used by the ROI calculator's amortisation line. The mid-point of the volume product. */
  roiReferenceProject: 60_000,
} as const;

/** ROI calculator defaults (§9). Deliberately conservative. */
export const ROI_DEFAULTS = {
  car: { walkins: 60, avgSale: 1_200_000, closeRate: 12, boostSpend: 15_000 },
  bike: { walkins: 60, avgSale: 180_000, closeRate: 12, boostSpend: 15_000 },
  /** Conservative 15% lift in QUALIFIED LEADS. Not the 40%+ foreign vendors quote (§9). */
  leadLift: 0.15,
} as const;

/** wa.me deep link. Message is pre-filled and the owner sends it with one tap. */
export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function siteName(locale: Locale): string {
  return locale === 'bn' ? 'ফিনিক্স' : 'Phoenix';
}
