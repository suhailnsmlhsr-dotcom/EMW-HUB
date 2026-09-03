import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { nextDocNumber } from '@/lib/docNumber';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'invoice').toLowerCase();
  const prefix = type === 'receipt' ? 'RCP' : 'INV';

  const db = supabaseServer();
  try {
    const docNumber = await nextDocNumber(db, prefix);
    return NextResponse.json({ docNumber });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
