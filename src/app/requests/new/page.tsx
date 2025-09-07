'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type Priority = 'emergency' | 'urgent' | 'non_critical' | 'routine';

export default function NewRequestPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [requestedByName, setRequestedByName] = useState('');
  const [priority, setPriority] = useState<Priority>('routine');
  const [business, setBusiness] = useState<string>('Pharmetric');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);

    const { error } = await supabase.from('work_orders').insert([
      {
        title,
        details: details || null,
        location: location || null,
        requested_by_name: requestedByName || null,
        priority,
        business: business || null,
        status: 'open',
      },
    ]);

    if (error) {
      setErr(error.message);
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
    // Clear the form
    setTitle('');
    setDetails('');
    setLocation('');
    setRequestedByName('');
    setPriority('routine');
    setBusiness('Pharmetric');
  };

  if (done) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Request Submitted</h1>
        <p className="mb-6">Thanks! Your request has been recorded.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setDone(false)}
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Submit another request
          </button>
          <button
            onClick={() => router.push('/')}
            className="rounded-md border px-4 py-2 bg-black text-white hover:opacity-90"
          >
            Go to homepage
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">New Request</h1>

      {err && <p className="mb-4 text-red-600">Error: {err}</p>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full rounded-md border px-3 py-2 min-h-[120px]"
            placeholder="Describe the issue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Room / Area"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Requested By</label>
            <input
              value={requestedByName}
              onChange={(e) => setRequestedByName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Business dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Business</label>
          <select
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            className="w-full rounded-md border px-3 py-2 bg-white"
          >
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </div>

        {/* Priority dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full rounded-md border px-3 py-2 bg-white"
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border px-4 py-2 bg-black text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </main>
  );
}
