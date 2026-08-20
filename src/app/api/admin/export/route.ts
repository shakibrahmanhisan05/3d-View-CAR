/**
 * GET /api/admin/export?type=leads|builds — CSV export (§15 Phase 8).
 *
 * The CRM in the Playbook is one shared Google Sheet. This is the on-ramp to it: download,
 * paste, done. No integration, no sync, nothing to maintain.
 */

import { NextResponse } from 'next/server';
import { isAuthed, toCsv } from '@/lib/admin';
import { listBuilds, listLeads } from '@/lib/store';

export async function GET(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get('type') === 'builds' ? 'builds' : 'leads';
  const rows = type === 'builds' ? await listBuilds() : await listLeads();
  const csv = toCsv(rows as unknown as Array<Record<string, unknown>>);

  const stamp = new Date().toISOString().slice(0, 10);

  // The leading BOM is what makes Excel read Bangla business names as UTF-8 instead of
  // mojibake. Without it, every name in the CRM sheet arrives broken on every machine.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="phoenix-${type}-${stamp}.csv"`,
    },
  });
}
