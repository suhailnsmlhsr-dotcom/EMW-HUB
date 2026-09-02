import { NextResponse } from 'next/server';
import { makeSessionCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();

  const validEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const validPassword = (process.env.ADMIN_PASSWORD || '').trim();

  const inputEmail = (email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  if (inputEmail === validEmail && inputPassword === validPassword) {
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', makeSessionCookie());
    return res;
  }

  return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
}
