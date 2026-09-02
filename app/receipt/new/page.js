'use client';
import Nav from '@/components/Nav';
import RequireAuth from '@/components/RequireAuth';
import ReceiptForm from '@/components/ReceiptForm';

export default function NewReceiptPage() {
  return (
    <>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>New Receipt</h1>
        <RequireAuth>
          <ReceiptForm />
        </RequireAuth>
      </div>
    </>
  );
}
