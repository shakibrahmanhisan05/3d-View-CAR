'use client';

/**
 * The lead form, fetched only when the reader gets near it.
 *
 * `ssr: false` is not permitted inside a Server Component, so the split lives here — a thin
 * client wrapper — rather than in the page. Used at the bottom of `/for/[slug]`, where the
 * form is a real conversion element but also the last thing on a long page; loading
 * react-hook-form for every visitor who never scrolls that far is bytes spent on nothing
 * (§14).
 *
 * On /contact the form IS the page and is imported directly. Do not use this there.
 */

import dynamic from 'next/dynamic';
import { WhenVisible } from '@/components/util/WhenVisible';

const LeadForm = dynamic(() => import('./LeadForm').then((m) => m.LeadForm), { ssr: false });

export function DeferredLeadForm({ source }: { source?: string }) {
  return (
    <WhenVisible minHeight={520}>
      <LeadForm source={source} />
    </WhenVisible>
  );
}
