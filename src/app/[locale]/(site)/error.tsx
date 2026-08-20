'use client';

/**
 * Route-level error boundary.
 *
 * "That is on our side, not yours" — a dealer who hits an error mid-demo needs to know it is
 * not something he did, and needs one obvious button. Nothing else.
 */

import { useEffect } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dict = useDict();

  useEffect(() => {
    console.error('[route]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-page flex-col justify-center px-4 py-20 sm:px-6">
      <p className="sheet-code">ERR{error.digest ? ` / ${error.digest}` : ''}</p>
      <h1 className="display mt-3 text-3xl font-700">{dict.errors.genericTitle}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{dict.errors.genericBody}</p>
      <button
        type="button"
        onClick={reset}
        className="tap mt-8 inline-flex w-fit items-center bg-ink px-5 py-3 text-sm font-600 text-paper"
      >
        {dict.common.tryAgain}
      </button>
    </div>
  );
}
