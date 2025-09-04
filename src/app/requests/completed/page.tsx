'use client';

import { useEffect, useState } from 'react';
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

export default function CompletedRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<WO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const authed = !!sessionData.session;
      setIsAuthed(authed);

      if (!authed) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('work_orders')
        .select('id,title,details,priority,status,created_at,requested_by_name,location')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setList(data || []);

      setLoading(false);
    };
    run();
  }, []);

  if (!isAuthed) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Completed Requests</h1>
          <div className="flex gap-3">
            <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/requests/new">
              New Request
            </Link>
            <Link className="px-3 py-2 rounded border" href="/login">
              Login
            </Link>
          </div>
        </div>
        <p className="text-gray-700">
          Please <Link className="text-blue-600 underline" href="/login">log in</Link> to view completed requests.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Completed Requests</h1>
        <div className="flex gap-3">
          <Link className="px-3 py-2 rounded border" href="/requests">
            Open / In-Progress
          </Link>
          <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/requests/new">
            New Request
          </Link>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Completed</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3">Requested By</th>
                <th className="text-left p-3">Location</th>
              </tr>
            </thead>
            <tbody>
              {list.map((wo) => (
                <tr key={wo.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap">
                    {wo.created_at ? new Date(wo.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="p-3">
                    <Link className="text-blue-600 underline" href={`/requests/${wo.id}`}>
                      {wo.title || '(no title)'}
                    </Link>
                  </td>
                  <td className="p-3 capitalize">{wo.priority?.replace('_', ' ') || '—'}</td>
                  <td className="p-3">{wo.requested_by_name || '—'}</td>
                  <td className="p-3">{wo.location || '—'}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-600" colSpan={5}>
                    No completed requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
