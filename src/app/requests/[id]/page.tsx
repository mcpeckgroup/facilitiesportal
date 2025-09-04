'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string | null;
  details: string | null;
  priority: 'emergency' | 'urgent' | 'non_critical' | 'routine' | null;
  status: 'open' | 'in_progress' | 'completed' | null;
  created_at: string | null;
  requested_by_name: string | null;
  location: string | null;
};

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [wo, setWo] = useState<WO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Please log in to view this request.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) setError(error.message);
      else setWo(data);

      setLoading(false);
    };
    if (id) run();
  }, [id]);

  const markComplete = async () => {
    if (!wo) return;
    setSaving(true);
    setError(null);

    // Append the completion note to details (non-destructive)
    const mergedDetails =
      (wo.details || '') + (note.trim() ? `\n\n[Completed Note]\n${note.trim()}` : '');

    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'completed', details: mergedDetails })
      .eq('id', wo.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/requests/completed');
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Request Detail</h1>
        <div className="flex gap-2">
          <Link className="px-3 py-2 rounded border" href="/requests">
            Open / In-Progress
          </Link>
          <Link className="px-3 py-2 rounded border" href="/requests/completed">
            Completed
          </Link>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {wo && (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <div className="text-sm text-gray-600">
              ID: <span className="font-mono">{wo.id}</span>
            </div>
            <h2 className="text-xl font-semibold mt-2">{wo.title || '(no title)'}</h2>
            <div className="text-gray-700 whitespace-pre-wrap mt-2">
              {wo.details || '(no details)'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <div className="text-gray-500">Priority</div>
                <div className="capitalize">{wo.priority?.replace('_', ' ') || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="capitalize">{wo.status?.replace('_', ' ') || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Requested By</div>
                <div>{wo.requested_by_name || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Location</div>
                <div>{wo.location || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Created</div>
                <div>{wo.created_at ? new Date(wo.created_at).toLocaleString() : '—'}</div>
              </div>
            </div>
          </div>

          {wo.status !== 'completed' && (
            <div className="border rounded p-4">
              <label className="block text-sm font-medium mb-2" htmlFor="complete-note">
                Completion note (optional)
              </label>
              <textarea
                id="complete-note"
                className="w-full border rounded p-2 min-h-[100px]"
                placeholder="What was done? Any follow-ups?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-3">
                <button
                  onClick={markComplete}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
                >
                  {saving ? 'Marking…' : 'Mark as Completed'}
                </button>
              </div>
            </div>
          )}

          {wo.status === 'completed' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-900">
              This request is already completed.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
