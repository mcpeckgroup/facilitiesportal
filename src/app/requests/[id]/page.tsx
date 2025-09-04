'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type WO = {
  id: string;
  title: string;
  details: string | null;
  location: string | null;
  status: 'open' | 'in_progress' | 'completed' | string | null;
  created_at: string | null;
  requested_by_name: string | null;
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [wo, setWo] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from('work_orders')
        .select('id,title,details,location,status,created_at,requested_by_name')
        .eq('id', id)
        .single();

      if (error) setErr(error.message);
      setWo(data ?? null);
      setLoading(false);
    })();
  }, [id]);

  async function markCompleted() {
    try {
      setSaving(true);
      setErr(null);

      // Append note into details (avoids needing a new column)
      const newDetails =
        (wo?.details ?? '') + (note ? `\n\nCompletion note: ${note}` : '');

      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'completed', details: newDetails })
        .eq('id', id);

      if (error) throw error;
      router.push('/requests/completed');
    } catch (e: any) {
      setErr(e?.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {wo && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{wo.title}</h1>
          <div className="text-gray-700 whitespace-pre-wrap">{wo.details ?? 'No details'}</div>
          <div className="text-sm text-gray-600">
            Location: {wo.location ?? '—'} • Status: {wo.status ?? '—'} •{' '}
            {wo.created_at ? new Date(wo.created_at).toLocaleString() : ''}
          </div>

          {wo.status !== 'completed' && (
            <div className="space-y-3 border rounded p-4">
              <label className="block">
                <span className="text-sm">Completion note (optional)</span>
                <textarea
                  className="mt-1 w-full border rounded px-3 py-2"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button
                onClick={markCompleted}
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Mark Completed'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
