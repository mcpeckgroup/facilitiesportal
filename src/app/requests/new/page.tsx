'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase/client';

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // form fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'emergency' | 'urgent' | 'non_critical' | 'routine'>('routine');
  const [business, setBusiness] = useState<'Infuserve America' | 'Pharmetric' | 'Issak'>('Pharmetric');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) return setErrorMsg('Title is required.');
    if (!name.trim()) return setErrorMsg('Your name is required.');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('work_orders').insert([
        {
          title: title.trim(),
          details: details.trim() || null,
          location: location.trim() || null,
          priority,                       // enum: emergency | urgent | non_critical | routine
          status: 'open',                 // default first status
          requested_by_name: name.trim(), // who submitted (no login required)
          business,                       // text column you added
        },
      ]);

      if (error) throw error;

      // go to the list or a thank-you page
      router.push('/requests');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">New Work Order Request</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Requester name */}
        <div>
          <label className="block text-sm font-medium mb-1">Your Name *</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
          />
        </div>

        {/* Business */}
        <div>
          <label className="block text-sm font-medium mb-1">Business *</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={business}
            onChange={(e) => setBusiness(e.target.value as any)}
            required
          >
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary"
            required
          />
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            className="w-full rounded border px-3 py-2 min-h-[120px]"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue or request…"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Building / Room"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority *</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as 'emergency' | 'urgent' | 'non_critical' | 'routine')
            }
            required
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
      {/* Note: Back-to-list link intentionally removed */}
    </main>
  );
}
