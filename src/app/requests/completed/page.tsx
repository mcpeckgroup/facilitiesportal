'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: string;
  business: string;
  completion_note: string | null;
}

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
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
    };

    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this completed work order?')) return;

    const { error } = await supabase.from('work_orders').delete().eq('id', id);

    if (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request.');
    } else {
      setRequests(requests.filter((req) => req.id !== id));
    }
  };

  if (loading) return <p>Loading completed requests...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Completed Requests</h1>
      {requests.length === 0 ? (
        <p>No completed requests found.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li key={req.id} className="border rounded p-4 shadow bg-gray-50">
              <h2 className="text-lg font-semibold">
                <Link href={`/requests/${req.id}`}>{req.title}</Link>
              </h2>
              <p className="text-sm text-gray-600">{req.description}</p>
              <p className="text-sm"><strong>Business:</strong> {req.business}</p>
              <p className="text-sm"><strong>Priority:</strong> {req.priority}</p>
              {req.completion_note && (
                <p className="text-sm text-green-700">
                  <strong>Completion Note:</strong> {req.completion_note}
                </p>
              )}
              <button
                onClick={() => handleDelete(req.id)}
                className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
