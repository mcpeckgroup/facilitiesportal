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
  completion_note: string | null;
  created_at: string;
}

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, []);

  if (loading) {
    return <p className="p-4">Loading completed requests...</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Completed Requests</h1>
      {requests.length === 0 ? (
        <p>No completed requests found.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li key={req.id} className="border p-4 rounded-lg shadow">
              <Link href={`/requests/${req.id}`}>
                <h2 className="text-xl font-semibold hover:underline">{req.title}</h2>
              </Link>
              <p className="text-sm text-gray-600">
                {req.business} • {req.priority}
              </p>
              <p className="mt-2 text-gray-700">{req.description}</p>
              {req.completion_note && (
                <p className="mt-2 text-green-700">
                  <strong>Completion Note:</strong> {req.completion_note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
