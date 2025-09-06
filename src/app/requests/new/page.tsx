'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '../../../lib/supabase/client';

const BUSINESSES = ['Infuserve America', 'Pharmetric', 'Issak'] as const;
const PRIORITIES = [
  { label: 'Emergency', value: 'emergency' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Non-Critical', value: 'non_critical' },
  { label: 'Routine', value: 'routine' },
] as const;

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState<typeof BUSINESSES[number] | ''>('');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]['value']>('routine');
  const [location, setLocation] = useState('');
  const [requestedByName, setRequestedByName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('work_orders').insert([
        {
          title,
          description,
          business: business || null,
          priority, // enum (emergency|urgent|non_critical|routine)
          status: 'open',
          location: location || null,
          requested_by_name: requestedByName || null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      router.push('/requests');
    } catch (e: any) {
      setErr(e.message ?? 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Request</h1>
        <Link href="/requests" className="text-blue-600 hover:underline">
          ← Back to list
        </Link>
      </div>

      {err && <div className="rounded bg-red-50 text-red-700 p-3 text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            required
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Business</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={business}
              onChange={(e) => setBusiness(e.target.value as any)}
            >
              <option value="">Select…</option>
              {BUSINESSES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Priority</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Location</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Suite 200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Requested By (name)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={requestedByName}
            onChange={(e) => setRequestedByName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </main>
  );
}
