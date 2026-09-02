'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateInvoicePDF } from '@/lib/pdf';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem() {
  return { workId: '', description: '', dateAssigned: '', amount: '' };
}

export default function InvoiceForm({ initialDoc }) {
  const router = useRouter();
  const isEdit = !!initialDoc;

  const [docNumber, setDocNumber] = useState(initialDoc?.doc_number || '');
  const [clientName, setClientName] = useState(initialDoc?.client_name || '');
  const [clientCourse, setClientCourse] = useState(initialDoc?.client_course || '');
  const [dateIssued, setDateIssued] = useState(initialDoc?.date_issued || todayStr());
  const [items, setItems] = useState(
    initialDoc?.work_items?.length ? initialDoc.work_items : [emptyItem()]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      fetch('/api/next-number')
        .then((r) => r.json())
        .then((d) => setDocNumber(d.docNumber));
    }
  }, [isEdit]);

  function updateItem(i, field, value) {
    const next = [...items];
    if (field === 'workId') {
      const digits = value.replace(/[^0-9]/g, '');
      value = digits ? 'W-' + digits : '';
    }
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  }

  function addItem() {
    setItems([...items, emptyItem()]);
  }
  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  function buildDoc() {
    return {
      doc_number: docNumber,
      doc_type: 'invoice',
      client_name: clientName,
      client_course: clientCourse,
      date_issued: dateIssued,
      work_items: items.map((i) => ({ ...i, amount: parseFloat(i.amount) || 0 })),
      total,
      status: initialDoc?.status || 'draft',
    };
  }

  async function save(andPrint) {
    if (!clientName.trim()) {
      alert('Client name is required.');
      return;
    }
    setSaving(true);
    const payload = buildDoc();
    const url = isEdit ? `/api/documents/${initialDoc.id}` : '/api/documents';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert('Save failed: ' + (d.error || res.status));
      return;
    }
    const data = await res.json();
    if (andPrint) generateInvoicePDF(data.document);
    router.push('/');
    router.refresh();
  }

  return (
    <div>
      <div className="card">
        <h2>Invoice Number</h2>
        <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="INV-0001" />
      </div>

      <div className="card">
        <h2>Billed To</h2>
        <label>Client Name</label>
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter party name" />
        <label>Course / Department</label>
        <input value={clientCourse} onChange={(e) => setClientCourse(e.target.value)} placeholder="Enter course / department" />
        <label>Date Issued</label>
        <input type="date" value={dateIssued} onChange={(e) => setDateIssued(e.target.value)} />
      </div>

      <div className="card">
        <h2>Work Items</h2>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, marginBottom: 12, position: 'relative' }}>
            {items.length > 1 && (
              <button
                onClick={() => removeItem(i)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#c0392b', fontSize: 12, cursor: 'pointer' }}
              >
                Remove
              </button>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label>Work ID</label>
                <input value={item.workId} onChange={(e) => updateItem(i, 'workId', e.target.value)} placeholder="Enter work number" />
              </div>
              <div>
                <label>Date Assigned</label>
                <input type="date" value={item.dateAssigned} onChange={(e) => updateItem(i, 'dateAssigned', e.target.value)} />
              </div>
            </div>
            <label>Description</label>
            <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Enter description" />
            <label>Amount (Rs.)</label>
            <input type="number" value={item.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)} placeholder="Enter amount" />
          </div>
        ))}
        <button className="btn btn-outline" style={{ width: '100%', borderStyle: 'dashed' }} onClick={addItem}>+ Add Work Item</button>
        <div style={{ textAlign: 'right', marginTop: 10, fontSize: 14, color: 'var(--gray)' }}>
          Total: <b style={{ color: 'var(--ink)', fontSize: 16 }}>Rs. {total.toFixed(2)}</b>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} disabled={saving} onClick={() => save(false)}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={() => save(true)}>
          {saving ? 'Saving...' : 'Save & Print'}
        </button>
      </div>
    </div>
  );
}
