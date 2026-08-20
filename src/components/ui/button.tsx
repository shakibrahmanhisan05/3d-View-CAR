/**
 * Button — shadcn/ui, retuned for the Obsidian palette.
 *
 * Variants map onto the token layer rather than literal colours, so `/for/[slug]` retinting
 * a prospect's `--ph-signal` restyles every primary button on their demo for free (§10).
 *
 * `size` floors at 44px on the touch-facing variants: this UI is driven one-handed on a
 * phone in a showroom, and a 36px control is a missed tap in front of a client (§5.10).
 */

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'text-sm font-600 leading-none',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ph-accent)]',
    'disabled:pointer-events-none disabled:opacity-45',
    'active:translate-y-px',
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(' '),
  {
    variants: {
      variant: {
        /*
          The action colour. One per screen — it is the WhatsApp/lead path.
          `text-signal-ink` rather than `text-ink`: a prospect can override --ph-signal with
          any hue, and white is the only foreground that survives all of them (§10).
        */
        primary:
          'bg-signal text-signal-ink shadow-elev hover:brightness-110 hover:shadow-glow',
        /* Inverted metal. The neutral confirm. */
        solid: 'bg-ink text-paper hover:bg-ink/90 shadow-elev',
        /* The default surface button — glass on the dark floor. */
        outline:
          'border border-glass-border bg-glass text-ink hover:border-[var(--ph-glass-border-lit)] hover:bg-glass-strong',
        /* Champagne: used for the elegance layer, e.g. "see the spec" affordances. */
        gold: 'border border-[color-mix(in_oklab,var(--ph-accent)_45%,transparent)] bg-accent-sunk text-accent-gold hover:bg-[color-mix(in_oklab,var(--ph-accent)_22%,var(--ph-paper))]',
        ghost: 'text-ink-soft hover:bg-glass hover:text-ink',
        link: 'text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-[var(--ph-accent)] hover:text-accent-gold',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element (a `<Link>`, an `<a>`) while keeping the button styling. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
