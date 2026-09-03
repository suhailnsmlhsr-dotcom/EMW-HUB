import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { nextDocNumber } from '@/lib/docNumber';

function inferPaymentMethod(description) {
  const d = (description || '').toLowerCase();
  if (d.includes('gpay') || d.includes('upi') || d.includes('phonepe') || d.includes('paytm')) return 'UPI';
  if (d.includes('bank') || d.includes('transfer') || d.includes('neft') || d.includes('imps')) return 'Bank Transfer';
  return 'Cash';
}

export async function POST(req) {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.SHEET_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const db = supabaseServer();

  if (body.action === 'create_invoice') {
    const { workId, date, clientName, clientCourse, workType, details, amount } = body;

    if (!workId || !clientName || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Skip if this Work ID already exists on any invoice
    const { data: existing, error: findErr } = await db
      .from('documents')
      .select('id, doc_number')
      .eq('doc_type', 'invoice')
      .filter('work_items', 'cs', JSON.stringify([{ workId }]));

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
    if (existing && existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: 'Work ID already exists', doc_number: existing[0].doc_number });
    }

    const docNumber = await nextDocNumber(db, 'INV');
    const workItem = {
      workId,
      description: [workType, details].filter(Boolean).join(' - ').slice(0, 250),
      dateAssigned: date,
      amount: Number(amount),
    };

    const { data, error } = await db
      .from('documents')
      .insert({
        doc_number: docNumber,
        doc_type: 'invoice',
        client_name: clientName,
        client_course: clientCourse || '',
        date_issued: date,
        work_items: [workItem],
        total: Number(amount),
        status: 'draft',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ created: true, doc_number: data.doc_number });
  }

  if (body.action === 'record_payment') {
    const { workId, date, amount, description } = body;

    if (!workId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: invoices, error: findErr } = await db
      .from('documents')
      .select('*')
      .eq('doc_type', 'invoice')
      .filter('work_items', 'cs', JSON.stringify([{ workId }]))
      .order('created_at', { ascending: true })
      .limit(1);

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No matching invoice found for Work ID ' + workId }, { status: 404 });
    }
    const invoice = invoices[0];

    // Sum all prior payments already recorded against this invoice
    const { data: priorReceipts, error: rErr } = await db
      .from('documents')
      .select('amount_paid')
      .eq('doc_type', 'receipt')
      .eq('linked_invoice_id', invoice.id);
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

    const alreadyPaid = (priorReceipts || []).reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
    const newTotalPaid = alreadyPaid + Number(amount);
    const balanceDue = Math.max(0, Number(invoice.total) - newTotalPaid);
    const method = inferPaymentMethod(description);

    const rcpNumber = await nextDocNumber(db, 'RCP');
    const insertBody = {
      doc_number: rcpNumber,
      doc_type: 'receipt',
      linked_invoice_id: invoice.id,
      linked_invoice_number: invoice.doc_number,
      client_name: invoice.client_name,
      client_course: invoice.client_course,
      date_issued: date,
      work_items: invoice.work_items,
      total: invoice.total,
      amount_paid: Number(amount),
      balance_due: balanceDue,
      cash_amount: method === 'Cash' ? Number(amount) : 0,
      upi_amount: method === 'UPI' ? Number(amount) : 0,
      bank_amount: method === 'Bank Transfer' ? Number(amount) : 0,
      payment_method: method,
      payment_date: date,
      status: balanceDue > 0 ? 'partial' : 'paid',
    };

    const { data: receipt, error: insErr } = await db.from('documents').insert(insertBody).select().single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    await db
      .from('documents')
      .update({ status: balanceDue > 0 ? 'partial' : 'paid', updated_at: new Date().toISOString() })
      .eq('id', invoice.id);

    return NextResponse.json({ created: true, doc_number: receipt.doc_number, balance_due: balanceDue });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
