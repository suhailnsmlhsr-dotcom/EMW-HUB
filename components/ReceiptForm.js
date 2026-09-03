'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateReceiptPDF } from '@/lib/pdf';
import ConfirmDialog from './ConfirmDialog';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReceiptForm({ initialDoc }) {
  const router = useRouter();
  const isEdit = !!initialDoc;

  const [mode, setMode] = useState(initialDoc?.linked_invoice_id ? 'linked' : 'manual');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialDoc?.linked_invoice_id || '');

  const [docNumber, setDocNumber] = useState(initialDoc?.doc_number || '');
  const [clientName, setClientName] = useState(initialDoc?.client_name || '');
  const [clientCourse, setClientCourse] = useState(initialDoc?.client_course || '');
  const [items, setItems] = useState(initialDoc?.work_items || []);
  const [total, setTotal] = useState(initialDoc?.total || 0);
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState(initialDoc?.linked_invoice_number || '');
  const [fileLabel, setFileLabel] = useState(initialDoc?.file_label || '');

  const [discountAmount, setDiscountAmount] = useState(initialDoc?.discount_amount || '');
  const [bonusAmount, setBonusAmount] = useState(initialDoc?.bonus_amount || '');

  const [paymentDate, setPaymentDate] = useState(initialDoc?.payment_date || todayStr());
  const [cashAmount, setCashAmount] = useState(initialDoc?.cash_amount || '');
  const [upiAmount, setUpiAmount] = useState(initialDoc?.upi_amount || '');
  const [bankAmount, setBankAmount] = useState(initialDoc?.bank_amount || '');
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      fetch('/api/next-number?type=receipt').then((r) => r.json()).then((d) => setDocNumber(d.docNumber));
    }
    fetch('/api/documents')
      .then((r) => r.json())
      .then((d) => setInvoices((d.documents || []).filter((doc) => doc.doc_type === 'invoice')));
  }, [isEdit]);

  function selectInvoice(id) {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setClientName(inv.client_name);
      setClientCourse(inv.client_course || '');
      setItems(inv.work_items || []);
      setTotal(inv.total || 0);
      setLinkedInvoiceNumber(inv.doc_number);
      const match = /^(?:INV|RCP)-(\d+)$/.exec(inv.doc_number || '');
      if (match) setDocNumber('RCP-' + match[1]);
    }
  }

  const discount = parseFloat(discountAmount) || 0;
  const bonus = parseFloat(bonusAmount) || 0;
  const netPayable = Math.max(0, (parseFloat(total) || 0) - discount - bonus);
  const amountPaid = (parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0) + (parseFloat(bankAmount) || 0);
  const balanceDue = Math.max(0, netPayable - amountPaid);

  function paymentMethodLabel() {
    const parts = [];
    if (parseFloat(cashAmount) > 0) parts.push('Cash');
    if (parseFloat(upiAmount) > 0) parts.push('UPI');
    if (parseFloat(bankAmount) > 0) parts.push('Bank Transfer');
    return parts.join(' + ') || '-';
  }

  function updateItem(i, field, value) {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  }
  function addItem() {
    setItems([...items, { workId: '', description: '', dateAssigned: '', amount: '' }]);
  }
  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function buildDoc() {
    return {
      doc_number: docNumber,
      doc_type: 'receipt',
      linked_invoice_id: mode === 'linked' ? selectedInvoiceId || null : null,
      linked_invoice_number: mode === 'linked' ? linkedInvoiceNumber : null,
      client_name: clientName,
      client_course: clientCourse,
      date_issued: paymentDate,
      file_label: fileLabel,
      work_items: items.map((i) => ({ ...i, amount: parseFloat(i.amount) || 0 })),
      total: parseFloat(total) || 0,
      discount_amount: discount,
      bonus_amount: bonus,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      cash_amount: parseFloat(cashAmount) || 0,
      upi_amount: parseFloat(upiAmount) || 0,
      bank_amount: parseFloat(bankAmount) || 0,
      payment_method: paymentMethodLabel(),
      payment_date: paymentDate,
      status: balanceDue > 0 ? 'partial' : 'paid',
    };
  }

  function validate() {
    if (!clientName.trim()) {
      alert('Client name is required.');
      return false;
    }
    if (amountPaid <= 0) {
      alert('Enter at least one payment amount.');
      return false;
    }
    return true;
  }

  async function doSave(andPrint) {
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
    if (andPrint) generateReceiptPDF(data.document);
    router.push('/');
    router.refresh();
  }

  function save(andPrint) {
    if (!validate()) return;
    if (mode === 'linked' && selectedInvoiceId) {
      setPendingPrint(andPrint);
      setConfirmOpen(true);
      return;
    }
    doSave(andPrint);
  }

  const [pendingPrint, setPendingPrint] = useState(false);

  function confirmAndSave() {
    setConfirmOpen(false);
    doSave(pendingPrint);
  }

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="Update invoice status?"
        message={`This will mark invoice ${linkedInvoiceNumber} as ${balanceDue > 0 ? 'Partially Paid' : 'Paid'} and save this receipt.`}
        confirmLabel="Confirm & Save"
        cancelLabel="Cancel"
        onConfirm={confirmAndSave}
        onCancel={() => setConfirmOpen(false)}
      />

      {!isEdit && (
        <div className="card">
          <h2>Source</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-sm"
              style={{ flex: 1, background: mode === 'linked' ? 'var(--ink)' : '#fff', color: mode === 'linked' ? '#fff' : 'var(--ink)', border: '1px solid var(--line)' }}
              onClick={() => setMode('linked')}
            >
              Select Existing Invoice
            </button>
            <button
              className="btn btn-sm"
              style={{ flex: 1, background: mode === 'manual' ? 'var(--ink)' : '#fff', color: mode === 'manual' ? '#fff' : 'var(--ink)', border: '1px solid var(--line)' }}
              onClick={() => setMode('manual')}
            >
              Enter Manually
            </button>
          </div>

          {mode === 'linked' && (
            <>
              <label>Choose Invoice</label>
              <select value={selectedInvoiceId} onChange={(e) => selectInvoice(e.target.value)}>
                <option value="">-- Select --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.doc_number} — {inv.client_name} (Rs. {Number(inv.total).toFixed(2)}) [{inv.status}]
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      <div className="card">
        <h2>Receipt Number</h2>
        <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="RCP-0001" />
        {linkedInvoiceNumber && <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>Against invoice: {linkedInvoiceNumber}</p>}
      </div>

      <div className="card">
        <h2>Billed To</h2>
        <label>Client Name</label>
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter party name" />
        <label>Course / Department</label>
        <input value={clientCourse} onChange={(e) => setClientCourse(e.target.value)} placeholder="Enter course / department" />
        <label>Payment Date</label>
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        <label>Download File Name (optional)</label>
        <input value={fileLabel} onChange={(e) => setFileLabel(e.target.value)} placeholder="Leave blank to use client name" />
      </div>

      <div className="card">
        <h2>Work Covered</h2>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, marginBottom: 12, position: 'relative' }}>
            <button
              onClick={() => removeItem(i)}
              style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#c0392b', fontSize: 12, cursor: 'pointer' }}
            >
              Remove
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label>Work ID</label>
                <input value={item.workId} onChange={(e) => updateItem(i, 'workId', e.target.value)} />
              </div>
              <div>
                <label>Date Assigned</label>
                <input type="date" value={item.dateAssigned} onChange={(e) => updateItem(i, 'dateAssigned', e.target.value)} />
              </div>
            </div>
            <label>Description</label>
            <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
            <label>Amount (Rs.)</label>
            <input type="number" value={item.amount} onChange={(e) => updateItem(i, 'amount', e.target.value)} />
          </div>
        ))}
        <button className="btn btn-outline" style={{ width: '100%', borderStyle: 'dashed' }} onClick={addItem}>+ Add Work Item</button>
        <label style={{ marginTop: 14 }}>Total Work Value (Rs.)</label>
        <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
      </div>

      <div className="card">
        <h2>Discount / Bonus (optional)</h2>
        <label>Discount (Rs.)</label>
        <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0" />
        <label>Bonus (Rs.)</label>
        <input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} placeholder="0" />
        {(discount > 0 || bonus > 0) && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray)' }}>
            Net Payable: <b style={{ color: 'var(--ink)', fontSize: 15 }}>Rs. {netPayable.toFixed(2)}</b>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Payment Received</h2>
        <label>Cash (Rs.)</label>
        <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0" />
        <label>UPI (Rs.)</label>
        <input type="number" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} placeholder="0" />
        <label>Bank Transfer (Rs.)</label>
        <input type="number" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} placeholder="0" />

        <div style={{ marginTop: 14, fontSize: 14, color: 'var(--gray)' }}>
          Amount Paid: <b style={{ color: '#1a7a34', fontSize: 16 }}>Rs. {amountPaid.toFixed(2)}</b>
        </div>
        {balanceDue > 0 && (
          <div style={{ fontSize: 14, color: 'var(--gray)' }}>
            Balance Due: <b style={{ color: '#a06a00', fontSize: 16 }}>Rs. {balanceDue.toFixed(2)}</b>
          </div>
        )}
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
