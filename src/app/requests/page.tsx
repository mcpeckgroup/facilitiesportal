'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type WO = {
  id: string;
  title: string;
  location: string | null;
  status: 'open' | 'in_progress' | 'completed' | string | null;
  created_at: string | null;
  requested_by_name: string | null;
};

export default function RequestsPage() {
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from('work_orders')
        .select('id,title,location,status,created_at,requested_by_name')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) setErr(error.message);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Work Orders — Open/In Progress</h1>
        <div className="space-x-2">
          <Link href="/requests/completed" className="underline">Completed</Link>
          <Link href="/requests/new" className="bg-black text-white px-3 py-2 rounded">New Request</Link>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}

      <ul className="divide-y border rounded">
        {items.map((wo) => (
          <li key={wo.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/requests/${wo.id}`} className="font-medium underline">{wo.title}</Link>
                <div className="text-sm text-gray-600">
                  {wo.location ?? 'No location'} • {wo.status ?? 'unknown'}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {wo.requested_by_name ?? 'Requester'} • {wo.created_at ? new Date(wo.created_at).toLocaleString() : ''}
              </div>
            </div>
          </li>
        ))}
        {(!loading && !err && items.length === 0) && (
          <li className="p-4 text-gray-600">No open items.</li>
        )}
      </ul>
    </main>
  );
}
