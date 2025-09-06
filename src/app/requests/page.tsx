'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  business: string | null;
  priority: 'emergency' | 'urgent' | 'non_critical' | 'routine' | null;
  location: string | null;
  status: 'open' | 'in_progress' | 'completed' | string | null;
  created_at: string;
};

export default function RequestsPage() {
  const [rows, setRows] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, business, priority, location, status, created_at')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });

      if (!isMounted) return;
      if (error) setErr(error.message);
      else setRows(data as WO[]);
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Open / In-Progress Requests</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <Link href="/requests/new">New Request</Link>
        <Link href="/requests/completed">Completed</Link>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: 'crimson' }}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px 6px' }}>Title</th>
                <th style={{ padding: '8px 6px' }}>Business</th>
                <th style={{ padding: '8px 6px' }}>Priority</th>
                <th style={{ padding: '8px 6px' }}>Location</th>
                <th style={{ padding: '8px 6px' }}>Status</th>
                <th style={{ padding: '8px 6px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 6px' }}>
                    <Link href={`/requests/${wo.id}`}>{wo.title}</Link>
                  </td>
                  <td style={{ padding: '8px 6px' }}>{wo.business || '—'}</td>
                  <td style={{ padding: '8px 6px' }}>{labelForPriority(wo.priority)}</td>
                  <td style={{ padding: '8px 6px' }}>{wo.location || '—'}</td>
                  <td style={{ padding: '8px 6px' }}>{labelForStatus(wo.status)}</td>
                  <td style={{ padding: '8px 6px' }}>
                    {new Date(wo.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: '#666' }}>
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function labelForPriority(p: WO['priority']) {
  switch (p) {
    case 'emergency':
      return 'Emergency';
    case 'urgent':
      return 'Urgent';
    case 'non_critical':
      return 'Non-Critical';
    case 'routine':
      return 'Routine';
    default:
      return '—';
  }
}

function labelForStatus(s: WO['status']) {
  switch (s) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return String(s || '—');
  }
}
