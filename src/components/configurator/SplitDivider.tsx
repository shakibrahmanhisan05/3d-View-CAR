'use client';

/**
 * The draggable divider for the before/after compare (§6.3).
 *
 * It writes the split position into a ref, NOT into state: the 3D pass reads that ref once
 * per frame, so dragging is a pure GPU-side change with zero React renders. Driving this
 * through state would re-render the whole configurator on every pointermove.
 *
 * §16 requires this to work on touch AND mouse, so it is pointer events throughout, plus
 * arrow keys for keyboard users.
 */

import { type RefObject, useCallback, useRef, useState } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';

export function SplitDivider({ splitRef }: { splitRef: RefObject<number> }) {
  const dict = useDict();
  const host = useRef<HTMLDivElement>(null);
  // Mirrored into state purely so the handle itself can be positioned in the DOM.
  const [visual, setVisual] = useState(splitRef.current);

  const set = useCallback(
    (ratio: number) => {
      const clamped = Math.min(0.98, Math.max(0.02, ratio));
      splitRef.current = clamped;
      setVisual(clamped);
    },
    [splitRef],
  );

  const fromEvent = useCallback(
    (clientX: number) => {
      const box = host.current?.getBoundingClientRect();
      if (!box || box.width === 0) return;
      set((clientX - box.left) / box.width);
    },
    [set],
  );

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 z-20">
      <div
        className="pointer-events-auto absolute inset-y-0 -ml-5 w-10 cursor-ew-resize touch-none"
        style={{ left: `${visual * 100}%` }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromEvent(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromEvent(event.clientX);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-paper/85" />

        <div
          role="slider"
          tabIndex={0}
          aria-label={dict.configurator.dragToCompare}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(visual * 100)}
          aria-valuetext={`${Math.round(visual * 100)}% ${dict.configurator.after}`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') set(splitRef.current - 0.04);
            else if (event.key === 'ArrowRight') set(splitRef.current + 0.04);
            else return;
            event.preventDefault();
          }}
          className="tap absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 bg-ink/85 text-paper"
        >
          <span aria-hidden="true" className="text-xs tracking-tighter">
            ◀▶
          </span>
        </div>
      </div>

      <span className="sheet-code absolute left-3 top-3 bg-ink/70 px-2 py-1 text-paper">
        {dict.configurator.before}
      </span>
      <span className="sheet-code absolute right-3 top-3 bg-ink/70 px-2 py-1 text-paper">
        {dict.configurator.after}
      </span>
    </div>
  );
}
