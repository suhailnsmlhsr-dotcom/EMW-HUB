import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const workId = (searchParams.get('workId') || '').trim();
  if (!workId) {
    return NextResponse.json({ error: 'Missing workId' }, { status: 400 });
  }

  const db = supabaseServer();
  const { data, error } = await db
    .from('work_lookup')
    .select('work_type, work_details, amount')
    .eq('work_id', workId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    workType: data.work_type || '',
    workDetails: data.work_details || '',
    amount: data.amount ?? null,
  });
}
