'use client';

/**
 * Accordion — Radix primitive. Used by the FAQ, which is also rendered as FAQPage JSON-LD,
 * so the questions must stay in the DOM for crawlers: Radix keeps the trigger text mounted
 * and only collapses the answer panel.
 *
 * REVISION 2: the FAQ is a LEDGER YOU CAN OPEN, not a stack of cards (§8.7). Each item is a
 * hairline-ruled row rather than a bordered box, the trigger grows to a 72px minimum so it is
 * a comfortable one-handed target, a 4px champagne bar slides in along the open row's inner
 * edge, and the chevron is drawn inline at 12px/1.5 — §19 forbids importing a new icon, and
 * lucide's 24px-grid ChevronDown read as UI chrome sitting on an editorial page.
 */

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('group/item relative border-b border-rule-faint', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group relative flex min-h-[72px] flex-1 items-center justify-between gap-4 py-5 pl-5 text-left text-base font-600',
        'transition-colors duration-200 hover:text-paint',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ph-accent)]',
        className,
      )}
      {...props}
    >
      {/* The open marker. Zero-width when closed, so the row has no left rule until it does. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-0 bg-accent-gold transition-[width] duration-300 ease-out group-data-[state=open]:w-1"
      />
      {children}
      <Chevron />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('max-w-2xl pb-6 pr-8 text-sm leading-relaxed text-ink-soft', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

/** 12px, stroke 1.5, drawn inline. The same mark as the plate pill's arrow, rotated. */
function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="mt-0.5 shrink-0 text-alu transition-[transform,color] duration-300 ease-out group-data-[state=open]:rotate-180 group-data-[state=open]:text-accent-gold"
    >
      <path d="m2 4.5 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
