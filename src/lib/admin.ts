/**
 * /admin gate (§15 Phase 8): "an env-var password with CSV export. No auth system."
 *
 * One shared password in `ADMIN_PASSWORD`, held in an httpOnly cookie. That is the whole
 * mechanism, on purpose — §17 puts auth, accounts and dashboards out of scope for months, and
 * four people sharing one password to read their own lead list is not a security model worth
 * building software for.
 *
 * If ADMIN_PASSWORD is unset the page refuses everyone rather than letting everyone in.
 */

import 'server-only';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'ph_admin';

export function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.trim() ? value : null;
}

/** Constant-time-ish compare. Not a threat model, just not leaking length by early return. */
export function matches(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  if (candidate.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return Boolean(value && matches(value));
}

/** RFC 4180 enough for Excel and Google Sheets, which is where these actually get opened. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const text = value instanceof Date ? value.toISOString() : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\r\n');
}
