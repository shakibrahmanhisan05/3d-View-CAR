/**
 * POST /api/lead — lead capture (§4, §15 Phase 8).
 *
 * The lead is stored AND the client is handed a WhatsApp deep link. WhatsApp is the primary
 * business channel (§1); the database exists so nothing is lost when a browser fails to open
 * the app, not as the destination.
 */

import { NextResponse } from 'next/server';
import { newId, saveLead } from '@/lib/store';
import { leadSchema } from '@/lib/validation';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;

  try {
    const lead = await saveLead({
      id: newId('l'),
      name: input.name,
      business: input.business,
      phone: input.phone,
      segment: input.segment,
      message: input.message || null,
      source: input.source ?? null,
      locale: input.locale,
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    // A storage failure must not stop the lead: the client still opens WhatsApp, which is
    // where the deal actually happens. Log it and admit it rather than pretending.
    console.error('[lead] storage failed', error);
    return NextResponse.json({ ok: false, error: 'storage' }, { status: 500 });
  }
}
