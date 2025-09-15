'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewRequestPage() {
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState('');
  const [priority, setPriority] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('work_orders').insert([
      {
        description,
        business,
        priority,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        status: 'open',
      },
    ]);

    setLoading(false);

    if (error) {
      alert('Error submitting request: ' + error.message);
    } else {
      router.push('/requests');
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit a New Work Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Your Name</label>
          <input
            type="text"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Your Email</label>
          <input
            type="email"
            value={submitterEmail}
            onChange={(e) => setSubmitterEmail(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Business</label>
          <select
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select Business</option>
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">Select Priority</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
