'use client';

/**
 * <PipRail> — the left vertical page index (§6.3).
 *
 * One dot per page section, the active one filled ember inside a champagne hair ring. It is
 * the ONLY scroll-bound element on the site (§19 forbids parallax, pinning and scrubbing),
 * and it is bound with an IntersectionObserver rather than a scroll listener so it costs
 * nothing per frame.
 *
 * The `-45% 0px -45% 0px` root margin collapses the viewport to a 10% band across its middle.
 * Exactly one section can intersect that band at a time, which is what makes "exactly one dot
 * active at any scroll position" a property of the geometry rather than of a tie-break rule.
 *
 * Keyboard: the rail is a single tab stop (roving tabindex), arrow keys walk it, Enter and
 * Space jump. `scrollIntoView({ behavior: 'smooth' })` is used unconditionally — Chromium and
 * Firefox both downgrade it to an instant jump under `prefers-reduced-motion`, which is the
 * behaviour we want and better than reimplementing it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';

export type PipItem = { id: string; label: string };

export function PipRail({ items }: { items: PipItem[] }) {
  const dict = useDict();
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [focused, setFocused] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const jump = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = items.length - 1;
    let next = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;

    event.preventDefault();
    setFocused(next);
    buttons.current[next]?.focus();
  };

  return (
    <nav
      aria-label={dict.scroll.label}
      className="pointer-events-none fixed inset-y-0 left-[max(0.75rem,calc((100vw-94rem)/2+var(--ph-frame-inset)))] z-30 hidden items-center lg:flex"
    >
      <ul className="pointer-events-auto flex flex-col items-center gap-1">
        {items.map((item, index) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <button
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                type="button"
                /* 44px of touch target around a 6px dot — the dot is the drawing, not the hit area. */
                className="tap group relative flex size-11 items-center justify-center"
                aria-current={isActive ? 'true' : undefined}
                tabIndex={focused === index ? 0 : -1}
                onFocus={() => setFocused(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => jump(item.id)}
              >
                <span className="sr-only">{item.label}</span>

                {/* The champagne hair ring. Present always; it only becomes visible when lit. */}
                <span
                  aria-hidden="true"
                  className="absolute size-3 rounded-full border transition-[opacity,transform] duration-[220ms] ease-out"
                  style={{
                    borderColor: 'color-mix(in oklab, var(--ph-accent) 70%, transparent)',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(0.9)',
                  }}
                />

                <span
                  aria-hidden="true"
                  className="rounded-full transition-[width,height,background-color,opacity] duration-[220ms] ease-out"
                  style={
                    isActive
                      ? { width: 6, height: 6, background: 'var(--ph-signal)', opacity: 1 }
                      : { width: 4, height: 4, background: 'var(--ph-alu)', opacity: 0.55 }
                  }
                />

                {/* The label, revealed on hover/focus. Mono, tracked, never in the layout. */}
                <span
                  aria-hidden="true"
                  className="sheet-code pointer-events-none absolute left-9 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
