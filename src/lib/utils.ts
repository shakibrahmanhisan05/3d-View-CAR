/**
 * `cn` — the shadcn/ui class merger.
 *
 * clsx resolves conditionals; tailwind-merge then drops earlier utilities that a later one
 * would conflict with. Without the merge step, a variant's `px-5` and a caller's `px-3` both
 * land in the class list and the winner is whichever Tailwind emitted last in the stylesheet —
 * which is not the caller. Every component in `src/components/ui` depends on this.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
