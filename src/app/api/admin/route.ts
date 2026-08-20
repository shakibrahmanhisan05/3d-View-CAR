/**
 * POST /api/admin — set the shared admin cookie. DELETE — clear it.
 *
 * See src/lib/admin.ts for why this is one password and not an auth system.
 */

import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminPassword, matches } from '@/lib/admin';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!adminPassword()) {
    return NextResponse.json({ ok: false, error: 'admin-password-not-set' }, { status: 503 });
  }
  if (!matches(password)) {
    // No detail about why. There is nothing useful to tell a wrong guess.
    return NextResponse.redirect(new URL('/admin?e=1', request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL('/admin', request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.redirect(new URL('/admin', request.url), { status: 303 });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
