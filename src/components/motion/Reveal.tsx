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

  if (reduced) return <MotionTag className={className}>{children}</MotionTag>;

  return (
    <MotionTag
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

  if (reduced) return <MotionTag className={className}>{children}</MotionTag>;

  return (
    <MotionTag
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

  if (reduced) return <MotionTag className={className}>{children}</MotionTag>;

  return (
    <MotionTag className={className} variants={revealVariants} transition={{ duration: 0.55, ease: EASE }}>
      {children}
    </MotionTag>
  );
}
