'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type PriorityInternal = 'emergency' | 'urgent' | 'non_critical' | 'routine';

const PRIORITY_OPTIONS: { label: string; value: PriorityInternal }[] = [
  { label: 'Emergency',     value: 'emergency' },
  { label: 'Urgent',        value: 'urgent' },         // (spelling fix from "urgant")
  { label: 'Non-Critical',  value: 'non_critical' },
  { label: 'Routine',       value: 'routine' },
];

export default function NewRequestPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<PriorityInternal>('routine');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      // Grab user (if logged in) so we can fill requested_by fields
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      const requesterName =
        auth.user?.user_metadata?.full_name ||
        auth.user?.email ||
        null;

      // Insert new work order
      const { error } = await supabase.from('work_orders').insert({
        title: title.trim(),
        details: details.trim() || null,
        location: location.trim() || null,
        priority,                 // <-- enum value (must exist in DB type)
        status: 'open',           // start new WOs as open
        requested_by_user: userId,
        requested_by_name: requesterName,
      });

      if (error) {
        // Common helpful hints for enum mismatches
        if (/invalid input value for enum/i.test(error.message)) {
          setErr(
            "Your database enum values for 'priority' don't match the app. Please ensure the wo_priority enum contains: emergency, urgent, non_critical, routine."
          );
        } else {
          setErr(error.message);
        }
        setSubmitting(false);
        return;
      }

      // Go back to list after successful submit
      router.push('/requests');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? 'Unknown error');
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Work Order</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[120px]"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add any helpful information"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Lab 3, 2nd Floor"
          />
        </div>

        {/* Priority dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority *</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityInternal)}
            required
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Options: Emergency, Urgent, Non-Critical, Routine
          </p>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/requests')}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
