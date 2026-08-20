/**
 * A second root layout, for /admin only.
 *
 * `app/[locale]/layout.tsx` is the root for the public site, but /admin deliberately has no
 * locale segment — it is an internal tool for four people, always in English, with no header,
 * no footer and no bilingual routing. Next supports one root layout per top-level segment,
 * which is exactly the shape this needs.
 */

import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import '../globals.css';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={fontVariables}>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
