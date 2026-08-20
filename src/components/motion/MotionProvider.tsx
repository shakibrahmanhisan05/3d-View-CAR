'use client';

/**
 * One shared Framer Motion feature bundle for the whole site.
 *
 * Why LazyMotion and not plain `motion.div`: importing `motion` pulls the full feature set
 * into the first-load bundle of every route that touches an animation. `LazyMotion` + the `m`
 * component ships a small core and fetches the DOM feature set separately. Every public route
 * here has a 130 kB first-load JS budget (§14) and the 3D routes have almost none to spare.
 *
 * `features` MUST be the async loader below, and it must point at `./features` rather than
 * at `motion/react` directly — see the comment in that file for why importing the barrel
 * dynamically silently un-splits the chunk.
 *
 * `strict` makes it a build-time error to use a full `motion.*` component anywhere under this
 * provider, which is what stops the lean bundle from silently regressing later.
 *
 * Children are passed through as a slot, so wrapping the tree here does NOT make the pages
 * below it client components.
 */

import { LazyMotion } from 'motion/react';
import type { ReactNode } from 'react';

const loadDomAnimation = () => import('./features').then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      {children}
    </LazyMotion>
  );
}
