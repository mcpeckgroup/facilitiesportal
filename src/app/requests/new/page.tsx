'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import Link from 'next/link';

type Priority = 'emergency' | 'urgent' | 'non_critical' | 'routine';

export default function NewRequestPage() {
  const [requestedByName, setRequestedByName] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState<Priority>('routine');
  const [poNumber, setPoNumber] = useState('');
  const [poNA, setPoNA] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const payload = {
      title,
      details,
      description: details,         // if you have both columns, keep them in sync
      priority,
      status: 'open',
      location,
      requested_by_name: requestedByName,
      po_number: poNA ? null : poNumber || null,
      po_na: poNA,
    };

    const { data, error } = await supabase
      .from('work_orders')
      .insert(payload)
      .select('id')
      .single();

    setSubmitting(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setDoneId(data?.id ?? null);
  };

  if (doneId) {
    return (
      <main className="max-w-2xl mx-auto pt-10 space-y-4">
        <h1 className="text-2xl font-semibold">Request submitted</h1>
        <p className="text-slate-700">Thank you! Your work order has been received.</p>
        <div className="flex gap-3">
          <Link href="/" className="px-4 py-2 rounded-md border hover:bg-slate-100">Back to Home</Link>
          <Link href="/requests/new" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            Submit another
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto pt-10">
      <h1 className="text-2xl font-semibold mb-6">New Request</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Your Name *</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={requestedByName}
              onChange={(e) => setRequestedByName(e.target.value)}
              required
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Location *</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="Building / Room"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm">Title *</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Details *</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 min-h-[120px]"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            placeholder="Describe the issue"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm">Priority *</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="non_critical">Non-Critical</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">PO Number (optional)</label>
            <input
              className="w-full border rounded-md px-3 py-2 disabled:opacity-60"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={poNA}
              placeholder="e.g. PO-12345"
            />
            <label className="inline-flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={poNA}
                onChange={(e) => setPoNA(e.target.checked)}
              />
              PO N/A
            </label>
          </div>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
          <Link href="/" className="px-4 py-2 rounded-md border hover:bg-slate-100">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
