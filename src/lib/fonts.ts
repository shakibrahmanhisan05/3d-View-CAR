/**
 * Typography (§3 — a hard constraint).
 *
 * Three faces, three jobs, self-hosted through next/font/google with explicit subsets so no
 * request ever leaves for fonts.googleapis.com at runtime.
 *
 * - Hind Siliguri carries the DEFAULT locale. Conjuncts are the risk: `শোরুম`, `গাড়ি`,
 *   `মোটরসাইকেল`, `কনফিগারেশন`, `যোগাযোগ করুন` must render correctly at display sizes.
 *   Hind Siliguri ships as static weights rather than a variable build, which is exactly
 *   why it is chosen — the conjunct breakage §3 warns about is a variable-font problem.
 *   Verify visually at /type-check before shipping.
 * - Archivo is the Latin display face. Mechanical, tight apertures, a real width axis.
 *   Not Inter, not Poppins, not Montserrat.
 * - JetBrains Mono carries EVERY numeral on the site — prices, cc, km, grades, ROI output.
 */

import { Archivo, Hind_Siliguri, JetBrains_Mono } from 'next/font/google';

export const archivo = Archivo({
  subsets: ['latin'],
  // The width axis is used for section headings; without it `display-wide` silently no-ops.
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hind',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const fontVariables = [archivo.variable, hindSiliguri.variable, jetbrainsMono.variable].join(' ');
