'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    async function fetchRequest() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else {
        setRequest(data);
        setCompletionNote(data?.completion_note || '');
      }
    }

    fetchRequest();
  }, [id]);

  async function markComplete() {
    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'completed', completion_note: completionNote })
      .eq('id', id);

    if (error) console.error(error);
    else router.push('/requests/completed');
  }

  if (!request) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{request.title}</h1>
      <p>{request.description}</p>
      <p><strong>Business:</strong> {request.business}</p>
      <p><strong>Priority:</strong> {request.priority}</p>
      <p><strong>Submitted by:</strong> {request.submitter_name} ({request.submitter_email})</p>

      {request.status !== 'completed' && (
        <div className="mt-6">
          <textarea
            className="border w-full p-2 mb-2"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder="Add completion note before closing"
          />
          <button
            onClick={markComplete}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {request.status === 'completed' && (
        <p className="mt-4"><strong>Completion Note:</strong> {request.completion_note}</p>
      )}
    </div>
  );
}
