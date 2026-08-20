'use client';

/**
 * Carries the ACTIVE locale's dictionary across the server/client boundary exactly once.
 *
 * The alternative — importing `bn`/`en` inside client components — would bundle both
 * locales' copy into the JS payload on every interactive page. This way the strings travel
 * as RSC data, compressed, one locale only.
 */

import { createContext, useContext } from 'react';
import type { Dictionary } from '@/lib/i18n';
import { fill } from '@/lib/i18n';
import type { Locale, Localized } from '@/lib/types';

type LocaleContextValue = { locale: Locale; dict: Dictionary };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dict,
  children,
}: LocaleContextValue & { children: React.ReactNode }) {
  // The value is a fresh object each render, but this provider sits in the root layout and
  // re-renders only on navigation, so memoising it would buy nothing.
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useDict() must be used inside <DictionaryProvider>. Check the root layout.');
  }
  return value;
}

export function useDict(): Dictionary {
  return useLocaleContext().dict;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

/** Resolve a bilingual value from data (vehicle names, option labels, hotspots). */
export function useLocalized(): (value: Localized) => string {
  const { locale } = useLocaleContext();
  return (value: Localized) => value[locale];
}

export { fill };
