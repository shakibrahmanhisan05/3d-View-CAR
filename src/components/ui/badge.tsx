/**
 * Badge — small status/label pill. Used for grade stamps, "recommended" markers and the
 * segment labels on demo tiles.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-600 leading-none tracking-wide uppercase',
  {
    variants: {
      variant: {
        outline: 'border-glass-border bg-glass text-ink-soft',
        signal:
          'border-[color-mix(in_oklab,var(--ph-signal)_50%,transparent)] bg-signal-sunk text-signal',
        gold: 'border-[color-mix(in_oklab,var(--ph-accent)_45%,transparent)] bg-accent-sunk text-accent-gold',
        solid: 'border-transparent bg-ink text-paper',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
