'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessFilter, setBusinessFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);

      let query = supabase.from('work_orders').select('*').eq('status', 'completed');

      if (businessFilter !== 'all') {
        query = query.eq('business', businessFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query.order('id', { ascending: false });

      if (!error) setRequests(data || []);
      setLoading(false);
    };

    fetchRequests();
  }, [businessFilter, priorityFilter]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Completed Work Orders</h1>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block font-medium">Filter by Business</label>
          <select
            className="border rounded px-2 py-1"
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Filter by Priority</label>
          <select
            className="border rounded px-2 py-1"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No completed requests found.</p>
      ) : (
        <ul className="divide-y">
          {requests.map((req) => (
            <li key={req.id} className="py-3">
              <Link href={`/requests/${req.id}`} className="text-blue-600 hover:underline">
                {req.title}
              </Link>
              <div className="text-sm text-gray-500">
                {req.business} • {req.priority}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
