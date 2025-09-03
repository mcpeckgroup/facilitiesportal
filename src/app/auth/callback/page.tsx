'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      // After user clicks the email link, Supabase creates a temporary session.
      // Here we update the password for the current authenticated user.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Password updated. Redirecting to login…');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e: any) {
      setErr(e.message ?? 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
        <form onSubmit={onUpdate} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">New password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          {msg && <p className="text-green-700 text-sm">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
