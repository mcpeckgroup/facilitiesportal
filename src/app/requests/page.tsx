'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [businessFilter, setBusinessFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setRequests(data || []);
    }

    fetchRequests();
  }, []);

  const filtered = requests.filter((r) => {
    return (
      (!businessFilter || r.business === businessFilter) &&
      (!priorityFilter || r.priority === priorityFilter)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Open Requests</h1>

      <div className="flex gap-4 mb-4">
        <select
          className="border px-2 py-1"
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
        >
          <option value="">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          className="border px-2 py-1"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      <ul className="space-y-3">
        {filtered.map((req) => (
          <li key={req.id} className="border p-3 rounded">
            <Link href={`/requests/${req.id}`} className="text-blue-600 font-semibold">
              {req.title}
            </Link>
            <p>{req.description}</p>
            <p><strong>Business:</strong> {req.business}</p>
            <p><strong>Priority:</strong> {req.priority}</p>
            <p><strong>Submitted by:</strong> {req.submitter_name} ({req.submitter_email})</p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link href="/requests/completed" className="text-blue-500 underline">
          View Completed Requests →
        </Link>
      </div>
    </div>
  );
}
