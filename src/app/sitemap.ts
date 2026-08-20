/**
 * sitemap.ts (§15 Phase 10).
 *
 * Both locales, with hreflang alternates. `/for/*`, `/pitch`, `/build/*` and `/admin` are
 * absent on purpose — they are private sales tools, and §10 requires the prospect demos to be
 * noindex.
 */

import type { MetadataRoute } from 'next';
import { LOCALES, localePath } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site';

const ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/demo/car', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/demo/bike', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/demo/360', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/demo/modification', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/process', priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/work', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' as const },
  { path: '/contact', priority: 0.7, changeFrequency: 'yearly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${SITE_URL}${localePath(locale, route.path)}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          'bn-BD': `${SITE_URL}${localePath('bn', route.path)}`,
          'en-GB': `${SITE_URL}${localePath('en', route.path)}`,
        },
      },
    })),
  );
}
