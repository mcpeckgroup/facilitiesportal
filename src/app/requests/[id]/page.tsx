'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  business: string | null;
  location: string | null;
  requested_by_name: string | null;
  created_at: string | null;
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wo, setWo] = useState<WO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('work_orders')
          .select(
            'id,title,description,status,priority,business,location,requested_by_name,created_at'
          )
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        setWo(data as WO);
      } catch (e: any) {
        setErr(e.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function markCompleted() {
    setErr(null);
    setSaving(true);
    try {
      const supabase = getSupabase();
      // If you have a column for notes like completion_note, include it here.
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'completed' /*, completion_note: note || null */ })
        .eq('id', id);

      if (error) throw error;
      router.push('/requests/completed');
    } catch (e: any) {
      setErr(e.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/requests" className="text-blue-600 hover:underline">
          ← Back
        </Link>
        <div />
      </div>

      {loading && <p>Loading…</p>}
      {err && <div className="rounded bg-red-50 text-red-700 p-3 text-sm">{err}</div>}
      {!loading && wo && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{wo.title ?? '(no title)'}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Status:</span> {wo.status}</div>
            <div><span className="font-medium">Priority:</span> {wo.priority}</div>
            <div><span className="font-medium">Business:</span> {wo.business ?? '—'}</div>
            <div><span className="font-medium">Location:</span> {wo.location ?? '—'}</div>
            <div><span className="font-medium">Requested By:</span> {wo.requested_by_name ?? '—'}</div>
            <div><span className="font-medium">Created:</span> {wo.created_at ? new Date(wo.created_at).toLocaleString() : '—'}</div>
          </div>
          <div>
            <h2 className="font-medium mb-1">Description</h2>
            <p className="whitespace-pre-wrap">{wo.description ?? '—'}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Completion note (optional)</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-24"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was done?"
            />
          </div>

          <button
            onClick={markCompleted}
            disabled={saving}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {saving ? 'Marking…' : 'Mark as Completed'}
          </button>
        </div>
      )}
    </main>
  );
}
