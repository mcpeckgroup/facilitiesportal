'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type PriorityValue = 'emergency' | 'urgent' | 'non_critical' | 'routine';

const PRIORITY_OPTIONS: { label: string; value: PriorityValue }[] = [
  { label: 'Emergency',     value: 'emergency' },
  { label: 'Urgent',        value: 'urgent' },       // note: spelled 'urgent' for DB enum
  { label: 'Non-Critical',  value: 'non_critical' },
  { label: 'Routine',       value: 'routine' },
];

const BUSINESS_OPTIONS = [
  'Infuserve America',
  'Pharmetric',
  'Issak',
] as const;

export default function NewRequestPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [priority, setPriority] = useState<PriorityValue>('routine');
  const [business, setBusiness] = useState<(typeof BUSINESS_OPTIONS)[number]>('Infuserve America');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setOkMsg(null);

    try {
      // Insert into public.work_orders
      const { error } = await supabase.from('work_orders').insert([
        {
          title,
          description,
          location,
          requested_by_name: requesterName || null,
          requested_by_user: null, // public form, no auth user
          priority,                // must match enum in DB if column is enum
          status: 'open',          // new requests start as open
          business,                // <-- NEW FIELD
        },
      ]);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setOkMsg('Request submitted successfully!');
        // optional: redirect to a thank-you or home after a short delay
        setTimeout(() => {
          router.push('/'); // change to '/requests' if you prefer
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>New Facilities Request</h1>
      <p style={{ marginBottom: '1rem' }}>
        Fill out the form below to submit a work order request.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Business <span style={{ color: 'crimson' }}>*</span></span>
          <select
            value={business}
            onChange={(e) => setBusiness(e.target.value as (typeof BUSINESS_OPTIONS)[number])}
            required
            style={{ padding: 8 }}
          >
            {BUSINESS_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Title <span style={{ color: 'crimson' }}>*</span></span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief summary"
            style={{ padding: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details of the issue"
            rows={5}
            style={{ padding: 8, resize: 'vertical' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Location</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Building A, Room 204"
            style={{ padding: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Priority <span style={{ color: 'crimson' }}>*</span></span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityValue)}
            required
            style={{ padding: 8 }}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Your name</span>
            <input
              type="text"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Jane Smith"
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Your email</span>
            <input
              type="email"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              placeholder="jane@example.com"
              style={{ padding: 8 }}
            />
          </label>
        </div>

        {errorMsg && (
          <div style={{ color: 'crimson', marginTop: 8 }}>
            {errorMsg}
          </div>
        )}
        {okMsg && (
          <div style={{ color: 'seagreen', marginTop: 8 }}>
            {okMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 14px',
            cursor: 'pointer',
            background: submitting ? '#aaa' : '#111',
            color: '#fff',
            border: 'none',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
