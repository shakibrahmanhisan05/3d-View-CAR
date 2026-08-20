/**
 * robots.ts (§15 Phase 10).
 *
 * `/for/` is disallowed here as well as being noindex in metadata and X-Robots-Tag in
 * next.config. Three layers is not paranoia: a prospect demo showing up in a Google result
 * for a dealer's own name would be an embarrassment we could not undo.
 */

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/for/', '/pitch', '/build/', '/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
