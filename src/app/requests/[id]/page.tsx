'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  note: string | null;
  completion_note: string | null;
  created_at: string;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    async function fetchRequest() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching request:', error.message);
      } else {
        setRequest(data);
        setNote(data.note || '');
        setCompletionNote(data.completion_note || '');
      }
      setLoading(false);
    }

    fetchRequest();
  }, [id]);

  async function handleUpdateNote() {
    const { error } = await supabase
      .from('work_orders')
      .update({ note })
      .eq('id', id);

    if (error) {
      alert('Error updating note: ' + error.message);
    } else {
      alert('Note updated!');
    }
  }

  async function handleMarkComplete() {
    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'completed', completion_note: completionNote })
      .eq('id', id);

    if (error) {
      alert('Error marking as complete: ' + error.message);
    } else {
      router.push('/requests/completed');
    }
  }

  if (loading) {
    return <p className="p-4">Loading request...</p>;
  }

  if (!request) {
    return <p className="p-4">Request not found.</p>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{request.title}</h1>
      <p>{request.description}</p>
      <p>
        <strong>Business:</strong> {request.business}
      </p>
      <p>
        <strong>Priority:</strong> {request.priority}
      </p>
      <p>
        <strong>Status:</strong> {request.status}
      </p>

      {/* Live Notes Update */}
      {request.status !== 'completed' && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Notes</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border p-2 rounded"
            rows={4}
          />
          <button
            onClick={handleUpdateNote}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Completion Section */}
      {request.status !== 'completed' && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Completion Note</h2>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="w-full border p-2 rounded"
            rows={4}
          />
          <button
            onClick={handleMarkComplete}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {request.status === 'completed' && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-green-700">Completion Note</h2>
          <p>{request.completion_note}</p>
        </div>
      )}
    </div>
  );
}
