'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { generateInvoicePDF, generateReceiptPDF } from '@/lib/pdf';

const STATUS_LABEL = { draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid' };

export default function HomePage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
    fetch('/api/me').then((r) => r.json()).then((d) => setAuthed(d.authenticated));
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocs(data.documents || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (tab !== 'all' && d.doc_type !== tab) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (d.client_name || '').toLowerCase().includes(q) ||
        (d.doc_number || '').toLowerCase().includes(q) ||
        (d.client_course || '').toLowerCase().includes(q)
      );
    });
  }, [docs, tab, query]);

  function reprint(doc) {
    if (doc.doc_type === 'invoice') generateInvoicePDF(doc);
    else generateReceiptPDF(doc);
  }

  async function remove(doc) {
    const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert('Delete failed.');
    setDeleteTarget(null);
  }

  function startRename(doc) {
    setRenamingId(doc.id);
    setRenameValue(doc.file_label || doc.client_name);
  }

  async function saveRename(doc) {
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_label: renameValue }),
    });
    if (res.ok) {
      setRenamingId(null);
      load();
    } else {
      alert('Rename failed.');
    }
  }

  return (
    <>
      <Nav />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        message={deleteTarget ? `${deleteTarget.doc_number} — ${deleteTarget.client_name}. This can't be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>Recent</h1>
        <p style={{ color: 'var(--gray)', fontSize: 13, margin: '0 0 18px' }}>
          {authed ? 'You can edit, rename, delete, and reprint.' : 'View and print. Log in to create or edit.'}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['all', 'invoice', 'receipt'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn btn-sm"
              style={{
                background: tab === t ? 'var(--ink)' : '#fff',
                color: tab === t ? '#fff' : 'var(--ink)',
                border: '1px solid var(--line)',
                textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All' : t + 's'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name, doc number, course..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {loading && <p style={{ color: 'var(--gray)' }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ color: 'var(--gray)' }}>Nothing here yet.</p>}

        {filtered.map((doc) => (
          <div key={doc.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{doc.doc_number}</span>
                  <span className={`badge badge-${doc.status}`}>{STATUS_LABEL[doc.status] || doc.status}</span>
                  <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase' }}>{doc.doc_type}</span>
                </div>

                {renamingId === doc.id ? (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ marginTop: 0 }}>File name (doesn't change the name on the document itself)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} style={{ flex: 1 }} />
                      <button className="btn btn-primary btn-sm" onClick={() => saveRename(doc)}>Save</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setRenamingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 15 }}>
                    {doc.client_name}
                    {doc.file_label && doc.file_label !== doc.client_name && (
                      <span style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 400 }}> (saved as: {doc.file_label})</span>
                    )}
                  </div>
                )}

                {doc.client_course && <div style={{ fontSize: 12, color: 'var(--gray)' }}>{doc.client_course}</div>}
                {doc.linked_invoice_number && (
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>Against {doc.linked_invoice_number}</div>
                )}
                <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600 }}>
                  Rs. {Number(doc.total || 0).toFixed(2)}
                  {doc.doc_type === 'receipt' && (
                    <span style={{ color: 'var(--gray)', fontWeight: 400 }}>
                      {' '}(paid Rs. {Number(doc.amount_paid || 0).toFixed(2)}
                      {doc.balance_due > 0 ? `, balance Rs. ${Number(doc.balance_due).toFixed(2)}` : ''})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => reprint(doc)}>Print / Download</button>
              {authed && (
                <>
                  <Link href={`/${doc.doc_type}/${doc.id}`} className="btn btn-outline btn-sm">Edit</Link>
                  {renamingId !== doc.id && (
                    <button className="btn btn-outline btn-sm" onClick={() => startRename(doc)}>Rename</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(doc)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
