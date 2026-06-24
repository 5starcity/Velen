'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // your existing firebase init
import { useRouter } from 'next/navigation';

/**
 * Admin Login Page
 * After sign-in, verify the user has admin role in Firestore,
 * then set the rezidence_admin_session cookie.
 */

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      // Verify admin claim — check Firestore or custom claims
      // Example with Firestore:
      // const snap = await getDoc(doc(db, 'admins', user.uid));
      // if (!snap.exists()) throw new Error('Not an admin account.');

      // Get ID token and send to your API to set an httpOnly cookie
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error('Access denied. This account does not have admin privileges.');

      router.push('/admin');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: '#2d5a28', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '15px',
          }}>R</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a2a1a', letterSpacing: '-0.01em' }}>
              Rezidence
            </div>
            <div style={{ fontSize: '11px', color: '#6b7c6b', fontWeight: 500 }}>Admin Portal</div>
          </div>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a2a1a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Sign in
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7c6b', marginBottom: '24px' }}>
          Admin access only
        </p>

        {error && (
          <div style={{
            background: '#fdf0f0', border: '1px solid #e8c0c0',
            color: '#8b2020', padding: '10px 12px',
            borderRadius: '6px', fontSize: '13px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: '10px 12px', border: '1px solid #e2e8e2',
              borderRadius: '6px', fontSize: '14px',
              fontFamily: 'inherit', outline: 'none',
              color: '#1a2a1a',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '10px 12px', border: '1px solid #e2e8e2',
              borderRadius: '6px', fontSize: '14px',
              fontFamily: 'inherit', outline: 'none',
              color: '#1a2a1a',
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '11px',
            background: loading ? '#9aaa9a' : '#2d5a28',
            color: '#ffffff', border: 'none',
            borderRadius: '6px', fontSize: '14px',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}