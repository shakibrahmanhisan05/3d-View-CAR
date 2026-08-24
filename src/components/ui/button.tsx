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

/*
 * NO SHAPE OR TYPE SIZE IN THE BASE.
 *
 * `cn()` no longer runs tailwind-merge (see src/lib/utils.ts), so two utilities from the same
 * property group landing in one class list are resolved by stylesheet order rather than by
 * the caller's intent. A base `rounded-lg` under the `plate` variant's `rounded-full`, or a
 * base `text-sm` under `size="sm"`'s `text-xs`, are exactly that case.
 *
 * Every variant now names its own radius and every size names its own type size, so no two
 * values from either group are ever emitted together. This is the "inline the two-merge
 * cases" the design plan lists as the lever to pull when the first-load budget gets tight.
 */
/*
 * NO `whitespace-nowrap`, AND NO FIXED HEIGHTS.
 *
 * Both were quietly breaking the default locale. Bangla CTA labels are long — "সেই প্রথম
 * শোরুমটা আপনার হতে পারে" is a whole sentence — and a nowrap button containing it has a
 * min-content width of ~500px. Inside a grid item (`min-width: auto`) that propagates all the
 * way out, and the homepage scrolled sideways by 212px on a 380px phone. The English build
 * never showed it, because "That first showroom could be yours" is half the width.
 *
 * So labels wrap, and `min-h-*` replaces `h-*` so a wrapped label makes the button taller
 * instead of spilling out of it. A single-line button is pixel-identical to before.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 text-center',
    'font-600 leading-snug',
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
          'rounded-full bg-signal text-signal-ink shadow-elev-sm hover:brightness-110 hover:shadow-elev',
        /* Inverted metal. The neutral confirm. */
        solid: 'rounded-full bg-ink text-paper hover:bg-ink/90 shadow-elev-sm',
        /* The default surface button — hairline pill, adapts to its ground via tokens. */
        outline:
          'rounded-full border border-glass-border-lit bg-glass text-ink hover:border-alu hover:bg-glass-strong',
        /* Bronze: used sparingly, e.g. "see the spec" affordances. */
        gold: 'rounded-full border border-[color-mix(in_oklab,var(--ph-accent)_45%,transparent)] bg-accent-sunk text-accent-bronze hover:bg-[color-mix(in_oklab,var(--ph-accent)_18%,var(--ph-paper))]',
        /*
          The quiet pill for every "explore / open / read more" affordance — one shape across
          the site, so the page reads designed rather than assembled.
        */
        plate:
          'rounded-full border border-glass-border bg-glass text-ink hover:border-glass-border-lit hover:bg-glass-strong',
        ghost: 'rounded-lg text-ink-soft hover:bg-glass hover:text-ink',
        link: 'rounded-lg text-ink underline decoration-rule-strong underline-offset-4 hover:text-signal hover:decoration-signal',
      },
      size: {
        sm: 'min-h-9 px-3 py-2 text-xs',
        md: 'min-h-11 px-5 py-2.5 text-sm',
        /* The primary CTA under the hero is now the visual anchor below the frame (§12). */
        lg: 'min-h-14 px-8 py-3.5 text-base',
        icon: 'size-11 text-sm',
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
