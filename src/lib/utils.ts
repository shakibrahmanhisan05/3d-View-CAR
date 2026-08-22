/**
 * `cn` — the class composer.
 *
 * WHY tailwind-merge IS NOT HERE ANY MORE
 * ---------------------------------------
 * It was, and it was doing real work: clsx resolves conditionals, and tailwind-merge then
 * dropped earlier utilities that a later one would conflict with, so a caller's `px-3` beat a
 * variant's `px-5` regardless of what order Tailwind happened to emit them in.
 *
 * The Revision 2 rebuild pushed `/` past its 195 kB first-load budget (§14), and dropping
 * tailwind-merge is the lever the design plan names for exactly this moment — it is ~8 kB of
 * the bundle on the one route where every kilobyte is competing with a 3D model on a
 * Chattogram mobile connection.
 *
 * WHAT THAT COSTS, AND WHAT WAS DONE ABOUT IT
 * -------------------------------------------
 * Two utilities from the same property group can now both survive into the class list, and
 * the winner is stylesheet order rather than authorial intent. Every `cn()` call site in
 * `src/components` was audited for that; exactly two were relying on the merge and both were
 * rewritten so the conflict cannot occur:
 *
 *   - `Button` — the base string carried `rounded-lg` and `text-sm` under a `plate` variant
 *     that wants `rounded-full` and sizes that want `text-xs` / `text-base`. Radius now lives
 *     on each variant, type size on each size, and neither group is ever emitted twice.
 *   - `DataRow` in Section.tsx — `border-b` with an `emphasis` override of `border-b-0`. Now
 *     a ternary that emits one or the other.
 *
 * Everything else composes disjoint properties or mutually exclusive ternary branches.
 *
 * THE RULE THIS INTRODUCES: a component must not layer two utilities from the same property
 * group and expect the later one to win. Branch instead. If a future component genuinely
 * needs caller-overrides-variant behaviour, that component should take an explicit prop.
 */

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
