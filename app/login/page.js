'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    const data = await res.json();
    if (data.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(data.error || 'Login failed');
    }
  }

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 16px' }}>
        <div className="card">
          <h2>Login</h2>
          <form onSubmit={submit}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
              {loading ? 'Checking...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
