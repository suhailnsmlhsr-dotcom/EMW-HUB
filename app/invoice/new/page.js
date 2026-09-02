'use client';
import Nav from '@/components/Nav';
import RequireAuth from '@/components/RequireAuth';
import InvoiceForm from '@/components/InvoiceForm';

export default function NewInvoicePage() {
  return (
    <>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>New Invoice</h1>
        <RequireAuth>
          <InvoiceForm />
        </RequireAuth>
      </div>
    </>
  );
}
