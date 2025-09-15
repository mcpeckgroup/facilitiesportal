'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  priority: string;
  business: string;
  status: string;
  completion_note?: string | null;
  created_at: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionNote, setCompletionNote] = useState('');

  // ✅ Make sure we always treat the ID as a string (not NaN!)
  const requestId = params?.id as string;

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', requestId) // use string UUID directly
        .single();

      if (error) {
        console.error('Error fetching request:', error.message);
      } else {
        setRequest(data);
      }
      setLoading(false);
    };

    fetchRequest();
  }, [requestId]);

  const markAsComplete = async () => {
    if (!requestId) return;

    const { error } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        completion_note: completionNote || null, // safe update
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error marking complete:', error.message);
    } else {
      router.push('/requests/completed');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!request) return <p>Request not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{request.title}</h1>
      <p className="mb-2"><strong>Description:</strong> {request.description}</p>
      <p className="mb-2"><strong>Priority:</strong> {request.priority}</p>
      <p className="mb-2"><strong>Business:</strong> {request.business}</p>
      <p className="mb-2"><strong>Status:</strong> {request.status}</p>
      <p className="mb-4"><strong>Created At:</strong> {new Date(request.created_at).toLocaleString()}</p>

      {request.status !== 'completed' ? (
        <div className="mt-6">
          <textarea
            placeholder="Completion note"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="border p-2 w-full rounded mb-2"
          />
          <button
            onClick={markAsComplete}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Mark as Complete
          </button>
        </div>
      ) : (
        <p><strong>Completion Note:</strong> {request.completion_note || 'None'}</p>
      )}
    </div>
  );
}
