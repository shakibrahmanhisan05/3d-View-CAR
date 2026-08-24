/**
 * Typography.
 *
 * Four faces, four jobs, self-hosted through next/font/google so no request ever
 * leaves for fonts.googleapis.com at runtime.
 *
 * - Hind Siliguri carries Bangla BODY and UI text. Static weights rather than a
 *   variable build, which is exactly why it is chosen — the conjunct breakage the
 *   spec warns about is a variable-font problem. Conjuncts verified at
 *   `/type-check` before shipping (শোরুম গাড়ি মোটরসাইকেল কনফিগারেশন যোগাযোগ করুন).
 * - Noto Serif Bengali carries BANGLA DISPLAY headlines. The default locale gets a
 *   real editorial voice instead of a bolded UI face; proper OpenType shaping from
 *   the Noto project keeps conjuncts correct at display sizes. Latin display stays
 *   a grotesque on purpose — each language gets its best face under one layout.
 * - Archivo is the Latin display face: mechanical, tight apertures, a real width
 *   axis for wordmarks and watermarks. Not Inter, not Poppins, not Montserrat.
 * - JetBrains Mono carries EVERY numeral on the site — prices, cc, km, grades,
 *   ROI output. Data reads as data.
 */

import { Archivo, Hind_Siliguri, JetBrains_Mono, Noto_Serif_Bengali } from 'next/font/google';

export const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
});

export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif-bengali',
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hind',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const fontVariables = [
  archivo.variable,
  notoSerifBengali.variable,
  hindSiliguri.variable,
  jetbrainsMono.variable,
].join(' ');
