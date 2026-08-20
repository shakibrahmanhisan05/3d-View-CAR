'use client';

/**
 * Mount children only once they are close to the viewport.
 *
 * Used for the lead form at the very bottom of `/for/[slug]`. That form is a real conversion
 * element, but it is also the last thing on a long page — downloading react-hook-form up
 * front costs every visitor who never scrolls that far, on mobile data, against a 130 kB
 * budget (§14).
 *
 * The 600px root margin means the chunk starts loading roughly a screen and a half before the
 * form is reached, so by the time a thumb gets there it is already interactive. Without
 * IntersectionObserver — or with JS that fails — the fallback is to mount immediately, which
 * is the safe direction for something that captures leads.
 */

import { useEffect, useRef, useState } from 'react';

export function WhenVisible({
  children,
  minHeight = 320,
}: {
  children: React.ReactNode;
  /** Reserved height, so revealing the content never shifts the page (§14: zero CLS). */
  minHeight?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const element = host.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShown(true);
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={host} style={shown ? undefined : { minHeight }}>
      {shown ? children : null}
    </div>
  );
}
