'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../lib/supabase/client';

type WO = {
  id: string;
  title: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
  business?: string | null;
  location?: string | null;
  requested_by_name?: string | null;
};

export default function RequestsPage() {
  const [rows, setRows] = useState<WO[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('work_orders')
          .select('id,title,priority,status,created_at,business,location,requested_by_name')
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRows(data || []);
      } catch (e: any) {
        setErr(e.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Requests</h1>
        <div className="flex gap-2">
          <Link href="/requests/completed" className="px-3 py-2 rounded border">
            Completed
          </Link>
          <Link href="/requests/new" className="px-3 py-2 rounded bg-black text-white">
            New Request
          </Link>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Business</th>
              <th className="text-left p-3">Priority</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/requests/${r.id}`} className="text-blue-600 hover:underline">
                    {r.title ?? '(no title)'}
                  </Link>
                </td>
                <td className="p-3">{r.business ?? '—'}</td>
                <td className="p-3">{r.priority ?? '—'}</td>
                <td className="p-3">{r.status ?? '—'}</td>
                <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
