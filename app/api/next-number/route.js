import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from('documents').select('doc_number');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let max = 0;
  for (const row of data) {
    const match = /INV-(\d+)/.exec(row.doc_number || '');
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(4, '0');
  return NextResponse.json({ docNumber: `INV-${next}` });
}
