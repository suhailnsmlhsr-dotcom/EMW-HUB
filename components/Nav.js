'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Nav() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        setAuthed(d.authenticated);
        setChecked(true);
      });
  }, []);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    setAuthed(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{ borderBottom: '1px solid var(--line)', background: '#fff' }}>
      <div className="nav-inner">
        <Link href="/" className="nav-logo" style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', textDecoration: 'none' }}>
          EM-WORKS
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {checked && authed && (
            <>
              <Link href="/invoice/new" className="btn btn-outline btn-sm">+ Invoice</Link>
              <Link href="/receipt/new" className="btn btn-outline btn-sm">+ Receipt</Link>
              <button onClick={logout} className="btn btn-sm" style={{ background: 'none', color: 'var(--gray)' }}>
                Logout
              </button>
            </>
          )}
          {checked && !authed && (
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>
      </div>
    </div>
  );
}
