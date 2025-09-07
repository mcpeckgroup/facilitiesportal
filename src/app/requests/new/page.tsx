'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Priority = 'emergency' | 'urgent' | 'non_critical' | 'routine';

export default function NewRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState('Infuserve America');
  const [priority, setPriority] = useState<Priority>('routine');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase.from('work_orders').insert({
        title,
        description,
        business,                  // requires a TEXT "business" column in work_orders
        priority,                  // enum: 'emergency' | 'urgent' | 'non_critical' | 'routine'
        status: 'open',            // assumes status enum includes 'open'
      });

      if (insertErr) throw insertErr;
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Request submitted ✅</h1>
        <p className="mb-6">Thanks! Your work request has been recorded.</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            type="button"
          >
            Go to Home
          </button>
          <button
            onClick={() => router.push('/requests/new')}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            type="button"
          >
            Submit Another
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New Work Request</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            className="w-full rounded border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            className="w-full rounded border p-2 min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Business</label>
          <select
            className="w-full rounded border p-2"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          >
            <option>Infuserve America</option>
            <option>Pharmetric</option>
            <option>issak</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Priority</label>
          <select
            className="w-full rounded border p-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {/* Labels are friendly; values match your enum */}
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <button
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </main>
  );
}
