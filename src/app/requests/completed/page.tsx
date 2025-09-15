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

  if (loading) {
    return <p className="p-4">Loading completed requests...</p>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Completed Requests</h1>
      {requests.length === 0 ? (
        <p>No completed requests found.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((req) => (
            <li key={req.id} className="border p-4 rounded shadow bg-gray-50">
              <Link href={`/requests/${req.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
