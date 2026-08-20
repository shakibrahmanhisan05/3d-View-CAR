'use client';

/**
 * FAQ (§4.8) — real objections only.
 *
 * Every question here is one a Chattogram showroom owner actually asks, taken from the
 * Playbook's objection table: how long, who owns it, what if I only sell used cars, will it
 * slow my site, what do you need from me, what happens after handover. No invented questions,
 * no "why choose us".
 *
 * This was a native <details> list, chosen so it worked before hydration. It is now the Radix
 * accordion, which needs JS — an accepted trade, because this is section 8 of the homepage:
 * by the time anyone has scrolled here the bundle has long since loaded, and in exchange the
 * answers open on a real height transition instead of snapping. The question text stays in
 * the DOM either way, so the FAQPage JSON-LD still matches what a crawler reads.
 */

import { useDict } from '@/components/i18n/DictionaryProvider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function Faq() {
  const dict = useDict();

  return (
    <Accordion type="single" collapsible className="max-w-3xl border-t border-glass-border-lit">
      {dict.faq.items.map((item, index) => (
        <AccordionItem key={item.q} value={`faq-${index}`}>
          <AccordionTrigger>
            <span className="flex items-baseline gap-4">
              <span className="sheet-code sheet-code-accent shrink-0 pt-1">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-base font-600 sm:text-lg">{item.q}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pl-[calc(2.5rem+1rem)]">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
