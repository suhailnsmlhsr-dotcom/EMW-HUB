import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function POST(req) {
  if (!isAuthenticated(req.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  const body = await req.json();
  const db = supabaseServer();

  const { data, error } = await db.from('documents').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If this is a receipt linked to an invoice, update the invoice's status/balance
  if (body.doc_type === 'receipt' && body.linked_invoice_id) {
    const newStatus = body.balance_due > 0 ? 'partial' : 'paid';
    await db
      .from('documents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', body.linked_invoice_id);
  }

  return NextResponse.json({ document: data });
}
