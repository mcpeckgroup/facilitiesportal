'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, []);

  // Apply filters
  const filteredRequests = requests.filter((req) => {
    const businessMatch = businessFilter === 'all' || req.business === businessFilter;
    const priorityMatch = priorityFilter === 'all' || req.priority === priorityFilter;
    return businessMatch && priorityMatch;
  });

  if (loading) {
    return <p className="p-4">Loading requests...</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Open Requests</h1>

      {/* Navigation Tabs */}
      <div className="mb-6 flex space-x-4">
        <Link
          href="/requests"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Open Requests
        </Link>
        <Link
          href="/requests/completed"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300"
        >
          Completed Requests
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="border p-2 rounded-lg"
        >
          <option value="all">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border p-2 rounded-lg"
        >
          <option value="all">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <p>No open requests found.</p>
      ) : (
        <ul className="space-y-4">
          {filteredRequests.map((req) => (
            <li key={req.id} className="border p-4 rounded-lg shadow">
              <Link href={`/requests/${req.id}`}>
                <h2 className="text-xl font-semibold hover:underline">{req.title}</h2>
              </Link>
              <p className="text-sm text-gray-600">
                {req.business} • {req.priority}
              </p>
              <p className="mt-2 text-gray-700">{req.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
