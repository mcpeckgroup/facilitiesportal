'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function NewRequestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [business, setBusiness] = useState('');
  const [priority, setPriority] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.from('work_orders').insert([
      {
        title,
        description,
        business,
        priority,
        status: 'open',
        submitter_name: submitterName,
        submitter_email: submitterEmail,
      },
    ]);

    if (error) {
      console.error(error);
      setError('Error submitting request: ' + error.message);
    } else {
      router.push('/requests');
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Work Order</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          className="border w-full p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          className="border w-full p-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <select
          className="border w-full p-2"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          required
        >
          <option value="">Select Business</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          className="border w-full p-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
          <option value="">Select Priority</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>

        <input
          type="text"
          placeholder="Your Name"
          className="border w-full p-2"
          value={submitterName}
          onChange={(e) => setSubmitterName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Your Email"
          className="border w-full p-2"
          value={submitterEmail}
          onChange={(e) => setSubmitterEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
