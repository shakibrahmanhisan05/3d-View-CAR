/**
 * Card — shadcn/ui, with the Obsidian depth treatment.
 *
 * `interactive` adds the shared `.lift` hover and the top lit edge. Both are defined once in
 * globals.css so a hover lift is identical on a pricing tile, a demo tile and a paint chip;
 * three slightly different lifts is what makes a dark UI feel homemade.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  interactive = false,
  tone = 'glass',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  /**
   * `glass` is a floating CARD. `plate` is a DOCUMENT — a flat, opaque sheet with a hairline
   * border, used by the ROI ledger, the contact envelope, the option panel and the care-plan
   * strip (§12). Paperwork should not float; that distinction is most of what stops eight
   * sections of glass rectangles reading as one long slideshow.
   */
  tone?: 'glass' | 'plate';
}) {
  return (
    <div
      className={cn(
        'lit-edge relative overflow-hidden',
        tone === 'plate' ? 'plate' : 'surface',
        interactive && 'lift cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-600 leading-snug tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-ink-soft', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />;
}
