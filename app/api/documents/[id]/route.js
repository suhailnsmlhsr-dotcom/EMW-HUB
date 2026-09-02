import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = await params;
  const db = supabaseServer();
  const { data, error } = await db.from('documents').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ document: data });
}

export async function PUT(req, { params }) {
  if (!isAuthenticated(req.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const db = supabaseServer();

  const { data, error } = await db
    .from('documents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data.doc_type === 'receipt' && data.linked_invoice_id) {
    const newStatus = data.balance_due > 0 ? 'partial' : 'paid';
    await db
      .from('documents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', data.linked_invoice_id);
  }

  return NextResponse.json({ document: data });
}

export async function DELETE(req, { params }) {
  if (!isAuthenticated(req.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  const { id } = await params;
  const db = supabaseServer();
  const { error } = await db.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
