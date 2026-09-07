import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// This webhook now ONLY keeps the work_lookup table in sync (Work ID -> Work Type / Work Details / Amount).
// It no longer auto-creates invoices or receipts — those are done manually on the site now.
export async function POST(req) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.SHEET_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const db = supabaseServer();

  if (body.action === 'sync_work_lookup') {
    const { workId, workType, details, amount } = body;

    if (!workId) {
      return NextResponse.json({ error: 'Missing workId' }, { status: 400 });
    }

    const parsedAmount = amount === '' || amount === undefined || amount === null ? null : Number(amount);

    const { error } = await db
      .from('work_lookup')
      .upsert(
        {
          work_id: String(workId).trim(),
          work_type: workType || '',
          work_details: details || '',
          amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'work_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ synced: true, workId });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
