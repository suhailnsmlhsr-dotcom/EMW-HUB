import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req) {
  const authed = isAuthenticated(req.headers.get('cookie'));
  return NextResponse.json({ authenticated: authed });
}
