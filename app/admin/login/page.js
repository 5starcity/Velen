'use client';

import { useState, Suspense } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import './admin-login.css';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');

    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.error || 'Too many attempts. Try again in a few minutes.');
        }
        if (res.status === 403 && data.error === 'Email not verified') {
          throw new Error('Verify your email before signing in.');
        }
        if (res.status === 403) {
          throw new Error('This account does not have admin access.');
        }
        throw new Error(data.error || 'Sign-in failed.');
      }

      const redirect = searchParams.get('redirect') || '/admin';
      router.push(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <div className="admin-login__logo">R</div>
          <div>
            <div className="admin-login__brand-name">Rezidence</div>
            <div className="admin-login__brand-sub">Admin Portal</div>
          </div>
        </div>

        <h1 className="admin-login__title">Sign in</h1>
        <p className="admin-login__subtitle">Admin access only</p>

        {error && <div className="admin-login__error">{error}</div>}

        <div className="admin-login__fields">
          <input
            className="admin-login__input"
            type="email"
            placeholder="Email address"
            value={email}
            autoComplete="email"
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="admin-login__input"
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          className="admin-login__submit"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}