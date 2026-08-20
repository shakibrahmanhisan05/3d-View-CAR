/**
 * Dictionary access.
 *
 * Server components import `getDictionary(locale)` directly. Client components read the
 * active dictionary out of <DictionaryProvider> — it crosses the boundary once, as RSC
 * payload data, so only ONE locale's strings are ever sent and none of it lands in the JS
 * bundle. That matters against the 130 kB initial-JS budget (§14).
 */

import type { Locale } from '@/lib/types';
import { bn, type Dictionary } from './bn';
import { en } from './en';

const DICTIONARIES: Record<Locale, Dictionary> = { bn, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** `t('এই ডেমোটি {date} পর্যন্ত সক্রিয়', { date })`. Deliberately not a template engine. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type { Dictionary };
export { bn, en };
