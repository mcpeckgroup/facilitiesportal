'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
  business?: string | null;
};

export default function CompletedRequestsPage() {
  const [rows, setRows] = useState<WO[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('work_orders')
          .select('id,title,priority,status,created_at,business')
          .eq('status', 'completed')
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
        <h1 className="text-2xl font-semibold">Completed</h1>
        <Link href="/requests" className="px-3 py-2 rounded border">
          Back to Open
        </Link>
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
              <th className="text-left p-3">Completed</th>
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
                <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Nothing completed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
