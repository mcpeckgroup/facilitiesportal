'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type WO = {
  id: number;
  title: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'completed';
  priority?: 'emergency' | 'urgent' | 'non_critical' | 'routine' | null;
  business?: string | null;
  completion_note?: string | null; // make sure this column exists
};

export default function WorkOrderDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [wo, setWo] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const id = Number(params.id);
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, description, status, priority, business, completion_note')
        .eq('id', id)
        .single();
      if (error) setErr(error.message);
      else {
        setWo(data);
        setNote(data?.completion_note ?? '');
      }
      setLoading(false);
    })();
  }, [params.id]);

  async function markComplete() {
    if (!wo) return;
    setSaving(true);
    setErr(null);
    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'completed', completion_note: note })
      .eq('id', wo.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace('/requests/completed');
  }

  async function deleteRequest() {
    if (!wo) return;
    if (!confirm('Delete this completed work order?')) return;
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from('work_orders').delete().eq('id', wo.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace('/requests/completed');
  }

  if (loading) return <main className="max-w-3xl mx-auto p-6">Loading…</main>;
  if (err) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      </main>
    );
  }
  if (!wo) return null;

  const isCompleted = wo.status === 'completed';

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{wo.title}</h1>
      <div className="text-sm text-gray-600">
        Status: <span className="font-medium">{wo.status}</span> · Priority:{' '}
        <span className="font-medium">{wo.priority ?? '—'}</span> · Business:{' '}
        <span className="font-medium">{wo.business ?? '—'}</span>
      </div>

      {wo.description && (
        <section>
          <h2 className="text-lg font-medium mb-1">Description</h2>
          <p className="whitespace-pre-wrap">{wo.description}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-1">Completion Note</h2>
        <textarea
          className="w-full min-h-[120px] rounded border p-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any notes for completion…"
        />
      </section>

      <div className="flex items-center gap-3">
        {!isCompleted && (
          <button
            onClick={markComplete}
            disabled={saving}
            className="rounded bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Mark Complete'}
          </button>
        )}
        {isCompleted && (
          <>
            <button
              onClick={markComplete}
              disabled={saving}
              className="rounded border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
              title="Update note"
            >
              {saving ? 'Saving…' : 'Update Note'}
            </button>
            <button
              onClick={deleteRequest}
              disabled={saving}
              className="rounded bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </main>
  );
}
