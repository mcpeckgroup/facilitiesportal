'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function NewRequestPage() {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) throw new Error('You must be signed in');

      // Insert minimal safe fields; DB defaults set status=open, created_at=now()
      const { error } = await supabase.from('work_orders').insert({
        requester: user.id,              // satisfies NOT NULL
        title,
        details: details || null,
        location: location || null,
        requested_by_name: requesterName || null
      });

      if (error) throw error;
      router.push('/requests');
    } catch (e: any) {
      setErr(e?.message ?? 'Submit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">New Work Order</h1>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Title</span>
          <input className="mt-1 w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
        </label>

        <label className="block">
          <span className="text-sm">Details</span>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={details} onChange={e => setDetails(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-sm">Location</span>
          <input className="mt-1 w-full border rounded px-3 py-2" value={location} onChange={e => setLocation(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-sm">Requested By (name)</span>
          <input className="mt-1 w-full border rounded px-3 py-2" value={requesterName} onChange={e => setRequesterName(e.target.value)} />
        </label>

        {err && <p className="text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </main>
  );
}
