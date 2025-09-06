'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase/client';

type FormState = { submitting: boolean; success?: string; error?: string };

export default function NewRequestPage() {
  const [form, setForm] = useState({
    name: '',
    business: '',
    location: '',
    title: '',
    details: '',
    priority: 'routine',
  });
  const [state, setState] = useState<FormState>({ submitting: false });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ submitting: true });
    try {
      const { error } = await supabase
        .from('work_orders')
        .insert([
          {
            title: form.title.trim(),
            details: form.details.trim(),
            priority: form.priority, // enum values: emergency | urgent | non_critical | routine
            status: 'open',
            requested_by_name: form.name.trim(),
            business: form.business || null, // assumes a 'business' text column exists
            location: form.location.trim() || null,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;

      setState({ submitting: false, success: 'Request submitted!' });
      setForm({
        name: '',
        business: '',
        location: '',
        title: '',
        details: '',
        priority: 'routine',
      });
    } catch (err: any) {
      setState({ submitting: false, error: err.message ?? 'Failed to submit' });
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Submit a Facilities Request</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            required
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="business" className="block text-sm font-medium mb-1">
            Business
          </label>
          <select
            id="business"
            name="business"
            value={form.business}
            onChange={onChange}
            required
            className="w-full border rounded-md px-3 py-2 bg-white"
          >
            <option value="">Select business…</option>
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="e.g., Lab 2, Suite 310"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={onChange}
            required
            placeholder="Brief summary"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="details" className="block text-sm font-medium mb-1">
            Details
          </label>
          <textarea
            id="details"
            name="details"
            value={form.details}
            onChange={onChange}
            rows={5}
            placeholder="Describe the issue or request"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={onChange}
            className="w-full border rounded-md px-3 py-2 bg-white"
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgant</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={state.submitting}
          className="w-full rounded-md px-4 py-2 border bg-black text-white disabled:opacity-60"
        >
          {state.submitting ? 'Submitting…' : 'Submit Request'}
        </button>

        {state.success && <p className="text-green-600 text-sm">{state.success}</p>}
        {state.error && <p className="text-red-600 text-sm">Error: {state.error}</p>}
      </form>
    </main>
  );
}
