'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  priority?: 'emergency' | 'urgent' | 'non_critical' | 'routine' | string;
  status?: 'open' | 'in_progress' | 'completed' | string;
  created_at?: string;
  location?: string | null;
  requested_by_name?: string | null;
  business?: string | null;
};

export default function CompletedRequestsPage() {
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, priority, status, created_at, location, requested_by_name, business')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        setErr(error.message);
      } else {
        setItems(data as WO[]);
      }
      setLoading(false);
    })();
  }, []);

  async function handleDelete(id: string) {
    const confirmMsg = 'Delete this completed work order? This cannot be undone.';
    if (!confirm(confirmMsg)) return;

    setDeletingId(id);
    const supabase = getSupabase();
    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    setDeletingId(null);

    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }
  if (err) {
    return <div className="p-6 text-red-600">Error: {err}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Completed Requests</h1>
        <div className="space-x-2">
          <Link href="/requests" className="px-3 py-2 border rounded hover:bg-gray-50">Open/In Progress</Link>
          <Link href="/requests/new" className="px-3 py-2 border rounded hover:bg-gray-50">New Request</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-600">No completed requests yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Business</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Requested By</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((wo) => (
                <tr key={wo.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <Link href={`/requests/${wo.id}`} className="text-blue-600 hover:underline">
                      {wo.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{wo.business ?? '-'}</td>
                  <td className="py-2 pr-3 capitalize">
                    {(wo.priority ?? '').replace('_', ' ')}
                  </td>
                  <td className="py-2 pr-3">{wo.location ?? '-'}</td>
                  <td className="py-2 pr-3">{wo.requested_by_name ?? '-'}</td>
                  <td className="py-2 pr-3">
                    {wo.created_at ? new Date(wo.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => handleDelete(wo.id)}
                      disabled={deletingId === wo.id}
                      className="px-3 py-1 border rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                      title="Delete permanently"
                    >
                      {deletingId === wo.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
