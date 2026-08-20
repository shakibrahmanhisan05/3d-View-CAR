/**
 * Zod schemas shared by the form and the route handler (§2).
 *
 * The phone rule is Bangladesh-specific on purpose: a generic "looks like a number" check
 * lets typos through, and a lead we cannot call back is not a lead. Accepted forms are what
 * a dealer actually types — `01712345678`, `+8801712345678`, `8801712345678`, with or
 * without spaces and dashes.
 */

import { z } from 'zod';

const BD_MOBILE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  business: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .refine((value) => BD_MOBILE.test(value), 'invalid-bd-mobile'),
  segment: z.enum(['car', 'bike', 'mod', 'recon']),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  source: z.string().trim().max(200).optional(),
  locale: z.enum(['bn', 'en']),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const buildSchema = z.object({
  vehicleId: z.string().trim().min(1).max(80),
  config: z.string().trim().max(600),
  totalBDT: z.number().int().min(0).max(100_000_000),
  prospect: z.string().trim().max(80).optional(),
  locale: z.enum(['bn', 'en']),
});

export type BuildInput = z.infer<typeof buildSchema>;

/** Normalise a Bangladeshi mobile to the digits-only form wa.me needs. */
export function toWhatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return digits;
}
