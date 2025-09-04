'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  location: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
  requested_by_name: string | null;
};

export default function RequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WO[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('work_orders')
        .select('id,title,location,priority,status,created_at,requested_by_name')
        .order('created_at', { ascending: false });

      if (error) setErr(error.message);
      else setRows(data || []);

      setLoading(false);
    })();
  }, [router]);

  if (loading) return <main className="pt-10">Loading…</main>;
  if (err) return <main className="pt-10 text-red-600">{err}</main>;

  return (
    <main className="pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        <div className="flex gap-2">
          <Link href="/requests/new" className="px-4 py-2 rounded-md border hover:bg-slate-100">New Request</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace('/'); }}
            className="px-4 py-2 rounded-md border hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Priority</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Requested By</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.title}</td>
                <td className="p-3">{r.location ?? '-'}</td>
                <td className="p-3 capitalize">{(r.priority ?? '').replace('_', ' ')}</td>
                <td className="p-3 capitalize">{(r.status ?? '').replace('_', ' ')}</td>
                <td className="p-3">{r.requested_by_name ?? '-'}</td>
                <td className="p-3">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>No work orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
