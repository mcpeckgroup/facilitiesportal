'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: string;
  business: string;
  status: string;
  completion_note: string | null;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching request:', error);
      } else {
        setRequest(data);
      }
      setLoading(false);
    };

    fetchRequest();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!id) return;

    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      console.error('Error marking request complete:', error);
      alert('Failed to mark as complete.');
    } else {
      alert('Request marked as complete.');
      router.push('/requests/completed');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this work order?')) return;

    const { error } = await supabase.from('work_orders').delete().eq('id', id);

    if (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request.');
    } else {
      alert('Work order deleted.');
      router.push('/requests/completed');
    }
  };

  if (loading) return <p>Loading request details...</p>;
  if (!request) return <p>Request not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{request.title}</h1>
      <p className="mb-2"><strong>Description:</strong> {request.description}</p>
      <p className="mb-2"><strong>Business:</strong> {request.business}</p>
      <p className="mb-2"><strong>Priority:</strong> {request.priority}</p>
      <p className="mb-2"><strong>Status:</strong> {request.status}</p>
      {request.completion_note && (
        <p className="mb-2 text-green-700">
          <strong>Completion Note:</strong> {request.completion_note}
        </p>
      )}

      <div className="flex space-x-4 mt-4">
        {request.status !== 'completed' && (
          <button
            onClick={handleMarkComplete}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Mark Complete
          </button>
        )}

        {request.status === 'completed' && (
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete
          </button>
        )}

        <Link href="/requests" className="text-blue-500 hover:underline">
          Back to Requests
        </Link>
      </div>
    </div>
  );
}
