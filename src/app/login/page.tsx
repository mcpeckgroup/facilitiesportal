'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
      }
      router.push('/requests');
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            className="mt-1 w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
        </button>
      </form>

      <button
        className="text-sm underline"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </main>
  );
}
