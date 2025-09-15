'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  completion_note: string | null;
  created_at: string;
}

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessFilter, setBusinessFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed requests:', error.message);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this completed request?')) return;

    const { error } = await supabase.from('work_orders').delete().eq('id', id);

    if (error) {
      alert('Error deleting request: ' + error.message);
    } else {
      setRequests(requests.filter((r) => r.id !== id));
    }
  }

  const filteredRequests = requests.filter((req) => {
    return (
      (businessFilter ? req.business === businessFilter : true) &&
      (priorityFilter ? req.priority === priorityFilter : true)
    );
  });

  if (loading) {
    return <p className="p-4">Loading completed requests...</p>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b pb-2 mb-4">
        <Link
          href="/requests"
          className="text-blue-600 hover:underline"
        >
          Open Requests
        </Link>
        <span className="font-bold border-b-2 border-blue-600">
          Completed Requests
        </span>
      </div>

      <h1 className="text-2xl font-bold">Completed Requests</h1>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <p>No completed requests found.</p>
      ) : (
        <ul className="space-y-2">
          {filteredRequests.map((req) => (
            <li key={req.id} className="border p-4 rounded shadow bg-gray-50">
              <Link
                href={`/requests/${req.id}`}
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {req.title}
              </Link>
              <p>{req.description}</p>
              <p>
                <strong>Business:</strong> {req.business}
              </p>
              <p>
                <strong>Priority:</strong> {req.priority}
              </p>
              {req.completion_note && (
                <p>
                  <strong>Completion Note:</strong> {req.completion_note}
                </p>
              )}
              <button
                onClick={() => handleDelete(req.id)}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
