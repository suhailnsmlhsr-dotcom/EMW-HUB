'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Nav from '@/components/Nav';
import RequireAuth from '@/components/RequireAuth';
import ReceiptForm from '@/components/ReceiptForm';

export default function EditReceiptPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setDoc(d.document);
        setLoading(false);
      });
  }, [id]);

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Edit Receipt</h1>
        <RequireAuth>
          {loading ? <p style={{ color: 'var(--gray)' }}>Loading...</p> : doc ? <ReceiptForm initialDoc={doc} /> : <p>Not found.</p>}
        </RequireAuth>
      </div>
    </>
  );
}
