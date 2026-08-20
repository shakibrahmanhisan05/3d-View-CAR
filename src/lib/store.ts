/**
 * Lead and build storage, server-only.
 *
 * Neon Postgres via Drizzle when `DATABASE_URL` is set; a JSON file under `.data/` when it is
 * not. The fallback is not a toy — it is what lets Hisan run the whole site, take a real lead
 * in a real showroom, and read it back from `/admin`, before anyone has signed up for
 * anything. A demo that cannot capture a lead because a database is missing is a demo that
 * loses the deal it was supposed to win.
 */

import 'server-only';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { desc } from 'drizzle-orm';
import type { BuildRow, LeadRow } from '@/lib/db/schema';
import { builds, leads } from '@/lib/db/schema';

const DATA_DIR = join(process.cwd(), '.data');

export type NewLead = Omit<LeadRow, 'createdAt'> & { createdAt?: Date };
export type NewBuild = Omit<BuildRow, 'createdAt'> & { createdAt?: Date };

// ---------------------------------------------------------------------------
// Database (optional)
// ---------------------------------------------------------------------------

type Db = Awaited<ReturnType<typeof connect>>;
let cached: Db | null | undefined;

async function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  // Imported lazily so the Neon driver is never pulled into a build that has no database.
  const [{ neon }, { drizzle }] = await Promise.all([
    import('@neondatabase/serverless'),
    import('drizzle-orm/neon-http'),
  ]);

  return drizzle(neon(url), { schema: { leads, builds } });
}

async function db() {
  if (cached === undefined) cached = await connect();
  return cached;
}

// ---------------------------------------------------------------------------
// JSON fallback
// ---------------------------------------------------------------------------

function readFile<T>(name: string): T[] {
  const path = join(DATA_DIR, name);
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T[];
  } catch {
    // A half-written file must not take the lead form down. Losing the local backlog is
    // recoverable; refusing a live lead is not.
    return [];
  }
}

function writeFile<T>(name: string, rows: T[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, name), `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function newId(prefix: string): string {
  // Short, URL-safe, and human-readable in a WhatsApp message. Collisions do not matter at
  // this volume, and a UUID in a shared link looks like spam.
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${random}`;
}

export async function saveLead(lead: NewLead): Promise<LeadRow> {
  const row: LeadRow = { ...lead, createdAt: lead.createdAt ?? new Date() };

  const client = await db();
  if (client) {
    await client.insert(leads).values(row);
    return row;
  }

  const rows = readFile<LeadRow>('leads.json');
  rows.unshift(row);
  writeFile('leads.json', rows);
  return row;
}

export async function listLeads(limit = 500): Promise<LeadRow[]> {
  const client = await db();
  if (client) return client.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);

  return readFile<LeadRow>('leads.json')
    .map((row) => ({ ...row, createdAt: new Date(row.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function saveBuild(build: NewBuild): Promise<BuildRow> {
  const row: BuildRow = { ...build, createdAt: build.createdAt ?? new Date() };

  const client = await db();
  if (client) {
    await client.insert(builds).values(row);
    return row;
  }

  const rows = readFile<BuildRow>('builds.json');
  rows.unshift(row);
  writeFile('builds.json', rows);
  return row;
}

export async function getBuild(id: string): Promise<BuildRow | null> {
  const client = await db();
  if (client) {
    const rows = await client.select().from(builds).limit(1000);
    return rows.find((row) => row.id === id) ?? null;
  }

  const row = readFile<BuildRow>('builds.json').find((entry) => entry.id === id);
  return row ? { ...row, createdAt: new Date(row.createdAt) } : null;
}

export async function listBuilds(limit = 500): Promise<BuildRow[]> {
  const client = await db();
  if (client) return client.select().from(builds).orderBy(desc(builds.createdAt)).limit(limit);

  return readFile<BuildRow>('builds.json')
    .map((row) => ({ ...row, createdAt: new Date(row.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function isUsingDatabase(): Promise<boolean> {
  return (await db()) !== null;
}
