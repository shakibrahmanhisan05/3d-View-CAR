'use client';

/**
 * Scroll-entry motion primitives.
 *
 * The rule from the design plan survives the restyle: motion arrives ONCE per element and is
 * never re-triggered, and it never moves anything the user is trying to read or tap. Sections
 * rise 16px and fade; nothing parallaxes, nothing pins, nothing scrubs to scroll position.
 *
 * `useReducedMotion` is honoured by rendering the elements in their final state with no
 * transition at all, rather than by animating faster — a 0.01ms animation still triggers a
 * paint and still moves the element, which is the thing being opted out of.
 *
 * THE JS BRANCH IS NOT ENOUGH ON ITS OWN, AND THAT WAS A CONTENT-HIDING BUG.
 * ------------------------------------------------------------------------
 * `useReducedMotion()` is state-plus-effect, so it reports `false` on the server and on the
 * first client render. Motion therefore commits `initial="hidden"` — `opacity: 0` and a 16px
 * translate — as inline styles before the hook flips. When it does flip, this component takes
 * the other branch and stops being a motion element, so nobody ever clears those inline
 * styles: with `prefers-reduced-motion: reduce` set, three sections of the homepage stayed
 * permanently invisible. Measured, not theorised.
 *
 * So the guarantee lives in CSS instead, keyed off `[data-reveal]` (see globals.css). A media
 * query is evaluated by the browser at parse time, needs no hydration, and `!important` beats
 * the inline style Motion may have written. The JS branch stays because it also stops the
 * animation from ever being scheduled — but the CSS is what makes the contract true.
 */

import { m, useReducedMotion, type Variants } from 'motion/react';
import type { ElementType, ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** Seconds. Use sparingly — anything past ~0.25s reads as the page being slow. */
  delay?: number;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduced) return <MotionTag data-reveal="" className={className}>{children}</MotionTag>;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      variants={revealVariants}
    >
      {children}
    </MotionTag>
  );
}

/**
 * The horizontal reveal — 700ms, 40px of `x`.
 *
 * Used ONCE on the whole site, on the pull-quote in §2. That is the point of it: eight
 * sections all rising 16px is a slideshow, and one element arriving from the side is the
 * thing that makes an eye stop. If this gets used a second time it stops working, so it is
 * deliberately not exposed as an option on <Reveal>.
 */
export function RevealX({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduced) return <MotionTag data-reveal="" className={className}>{children}</MotionTag>;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Staggers direct children. Each child must be a <RevealItem>. Used for card grids and
 * option rows, where a single block fade reads as a slab and a stagger reads as a deal.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduced) return <MotionTag data-reveal="" className={className}>{children}</MotionTag>;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-48px' }}
      variants={{ shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = m[as as keyof typeof m] as typeof m.div;

  if (reduced) return <MotionTag data-reveal="" className={className}>{children}</MotionTag>;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      variants={revealVariants}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
