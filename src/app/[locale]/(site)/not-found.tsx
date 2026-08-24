/**
 * 404 (§16: "every string renders in both Bangla and English — including errors and empty
 * states"). Bilingual because a 404 is exactly where a lost dealer lands.
 */

import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, localePath } from '@/lib/i18n/config';

export default function NotFound() {
  // A not-found boundary renders without route params, so it cannot know the locale. It falls
  // back to Bangla, which is the default and the majority reader anyway.
  const dict = getDictionary(DEFAULT_LOCALE);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-page flex-col justify-center px-4 py-20 sm:px-6">
      <p className="sheet-code">404</p>
      <h1 className="display mt-3 text-3xl font-700 sm:text-4xl">{dict.errors.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{dict.errors.notFoundBody}</p>
      <Link
        href={localePath(DEFAULT_LOCALE, '/')}
        className="tap mt-8 inline-flex w-fit items-center rounded-full bg-ink px-6 py-3 text-sm font-600 text-paper transition-opacity hover:opacity-90"
      >
        {dict.errors.notFoundCta}
      </Link>
    </div>
  );
}
