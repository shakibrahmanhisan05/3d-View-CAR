/**
 * Drizzle schema (§2).
 *
 * Two tables and no more. There is no auth, no accounts, no multi-tenancy — §17 puts all of
 * that out of scope for months, and a dealer dashboard we do not need is a dashboard we would
 * have to maintain instead of visiting showrooms.
 *
 * Create them with `pnpm drizzle-kit push` once DATABASE_URL is set. Until then everything
 * falls through to `.data/*.json` (see src/lib/store.ts) and the site runs with zero
 * credentials.
 */

import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  name: text('name').notNull(),
  business: text('business').notNull(),
  /** Stored as typed, not normalised: a dealer's own formatting is a data point. */
  phone: text('phone').notNull(),
  segment: text('segment').notNull(),
  message: text('message'),
  /** Which page or prospect demo produced the lead — '/for/twenty-eight-motors', etc. */
  source: text('source'),
  locale: text('locale').notNull(),
});

/**
 * Saved configurations behind a share link (§4 `/api/build`, `/build/[id]`).
 *
 * Playbook §9: every configuration a buyer makes is a stated preference he volunteered.
 * Which colour gets picked most, which trim gets abandoned. Worthless for a year, then it is
 * demand data on the Chattogram vehicle market that exists nowhere else. Log it from client
 * one — that is the whole reason this table stores the selection rather than just a URL.
 */
export const builds = pgTable('builds', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  vehicleId: text('vehicle_id').notNull(),
  /** Encoded selection, e.g. `paint~racing-blue.wheels~wheel-touring`. */
  config: text('config').notNull(),
  totalBdt: integer('total_bdt').notNull(),
  prospect: text('prospect'),
  locale: text('locale').notNull(),
});

export type LeadRow = typeof leads.$inferSelect;
export type BuildRow = typeof builds.$inferSelect;
