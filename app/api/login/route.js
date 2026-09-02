import { NextResponse } from 'next/server';
import { makeSessionCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (email === validEmail && password === validPassword) {
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', makeSessionCookie());
    return res;
  }

  return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
}
