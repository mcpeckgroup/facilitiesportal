'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  details?: string | null;
  description?: string | null;
  priority?: 'emergency' | 'urgent' | 'non_critical' | 'routine' | string;
  status?: 'open' | 'in_progress' | 'completed' | string;
  created_at?: string;
  location?: string | null;
  requested_by_name?: string | null;
  business?: string | null;
  note?: string | null; // if you store a completion note on the row
};

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wo, setWo] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, details, description, priority, status, created_at, location, requested_by_name, business, note')
        .eq('id', id)
        .single();

      if (error) setErr(error.message);
      else setWo(data as WO);
      setLoading(false);
    })();
  }, [id]);

  async function markComplete() {
    if (!wo) return;
    if (!confirm('Mark this work order as completed?')) return;

    setCompleting(true);
    const supabase = getSupabase();
    const updates: Partial<WO> = { status: 'completed' };
    if (note.trim()) (updates as any).note = note.trim();

    const { error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', wo.id);

    setCompleting(false);

    if (error) {
      alert('Failed to complete: ' + error.message);
      return;
    }
    // Refresh view
    setWo({ ...wo, ...updates });
  }

  async function deleteCompleted() {
    if (!wo) return;
    const confirmMsg = 'Delete this completed work order? This cannot be undone.';
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    const supabase = getSupabase();
    const { error } = await supabase.from('work_orders').delete().eq('id', wo.id);
    setDeleting(false);

    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    router.push('/requests/completed');
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!wo) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Work Order</h1>
        <div className="space-x-2">
          <Link href="/requests" className="px-3 py-2 border rounded hover:bg-gray-50">Back to Requests</Link>
          <Link href="/requests/completed" className="px-3 py-2 border rounded hover:bg-gray-50">Completed</Link>
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        <div><span className="font-medium">Title:</span> {wo.title}</div>
        <div><span className="font-medium">Business:</span> {wo.business ?? '-'}</div>
        <div><span className="font-medium">Priority:</span> {(wo.priority ?? '').replace('_', ' ')}</div>
        <div><span className="font-medium">Status:</span> {wo.status}</div>
        <div><span className="font-medium">Location:</span> {wo.location ?? '-'}</div>
        <div><span className="font-medium">Requested By:</span> {wo.requested_by_name ?? '-'}</div>
        <div><span className="font-medium">Created:</span> {wo.created_at ? new Date(wo.created_at).toLocaleString() : '-'}</div>
        <div><span className="font-medium">Description:</span> {wo.description ?? wo.details ?? '-'}</div>
        {wo.note ? (
          <div><span className="font-medium">Note:</span> {wo.note}</div>
        ) : null}
      </div>

      {wo.status !== 'completed' ? (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a completion note (optional)…"
            className="w-full border rounded p-2"
            rows={3}
          />
          <button
            onClick={markComplete}
            disabled={completing}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
          >
            {completing ? 'Completing…' : 'Mark as Completed'}
          </button>
        </div>
      ) : (
        <div className="space-x-2">
          <button
            onClick={deleteCompleted}
            disabled={deleting}
            className="px-4 py-2 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete (Completed)'}
          </button>
        </div>
      )}
    </div>
  );
}
