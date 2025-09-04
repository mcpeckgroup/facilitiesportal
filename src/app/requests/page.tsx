'use client';

import { useEffect, useState } from 'react';
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
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from('work_orders')
      .select('id,title,location,priority,status,created_at,requested_by_name')
      .in('status', ['open', 'in_progress']) // show only open/in_progress
      .order('created_at', { ascending: false });

    if (error) setErr(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Requests</h1>
        <div className="flex gap-2">
          <Link
            href="/requests/new"
            className="px-3 py-2 rounded-md bg-gray-900 text-white"
          >
            + New Request
          </Link>
          <button
            onClick={load}
            className="px-3 py-2 rounded-md border hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/requests"
          className="px-3 py-1.5 rounded-md bg-gray-900 text-white"
        >
          Open
        </Link>
        <Link
          href="/requests/completed"
          className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
        >
          Completed
        </Link>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      <ul className="divide-y">
        {items.map((wo) => (
          <li key={wo.id} className="py-4">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/requests/${wo.id}`} className="font-medium hover:underline">
                  {wo.title}
                </Link>
                <div className="text-sm text-gray-500">
                  {wo.location ? `${wo.location} · ` : ''}
                  {wo.priority ?? '—'} · {wo.status ?? '—'}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {wo.created_at ? new Date(wo.created_at).toLocaleString() : ''}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Requested by: {wo.requested_by_name ?? '—'}
            </div>
          </li>
        ))}
        {!loading && !err && items.length === 0 && (
          <li className="py-8 text-gray-500">No open requests yet.</li>
        )}
      </ul>
    </div>
  );
}
