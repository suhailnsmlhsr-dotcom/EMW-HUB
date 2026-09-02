'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | denied
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setStatus('ok');
        else {
          setStatus('denied');
          router.push('/login');
        }
      });
  }, [router]);

  if (status !== 'ok') {
    return <p style={{ padding: 20, color: 'var(--gray)' }}>Checking login...</p>;
  }
  return children;
}
