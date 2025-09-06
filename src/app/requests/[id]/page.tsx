'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  description: string | null;
  business: string | null;
  priority: 'emergency' | 'urgent' | 'non_critical' | 'routine' | string | null;
  location: string | null;
  status: 'open' | 'in_progress' | 'completed' | string | null;
  requested_by_name: string | null;
  created_at: string;
};

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { id } = params;

  const [wo, setWO] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, title, description, business, priority, location, status, requested_by_name, created_at')
        .eq('id', id)
        .maybeSingle();

      if (!alive) return;
      if (error) setErr(error.message);
      else setWO(data as WO);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function markCompleted() {
    if (!wo) return;
    const note = noteRef.current?.value?.trim() || '';
    setSaving(true);
    setErr(null);
    setOkMsg(null);

    try {
      const newDescription = note
        ? `${wo.description ? wo.description + '\n\n' : ''}Completed note: ${note}`
        : wo.description ?? '';

      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'completed', description: newDescription })
        .eq('id', wo.id);

      if (error) {
        setErr(error.message);
      } else {
        setOkMsg('Marked as completed.');
        // reload and/or go to completed list
        setTimeout(() => {
          router.push('/requests/completed');
        }, 600);
      }
    } catch (e: any) {
      setErr(e?.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: 'crimson' }}>{err}</div>;
  if (!wo) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '1rem' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/requests">← Back to Requests</Link>
      </div>

      <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>{wo.title}</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>
        Created: {new Date(wo.created_at).toLocaleString()}
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <InfoRow label="Business" value={wo.business || '—'} />
        <InfoRow label="Priority" value={labelForPriority(wo.priority)} />
        <InfoRow label="Location" value={wo.location || '—'} />
        <InfoRow label="Status" value={labelForStatus(wo.status)} />
        <InfoRow label="Requested By" value={wo.requested_by_name || '—'} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '10px 0' }}>Description</h3>
        <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', border: '1px solid #eee', padding: 12 }}>
          {wo.description || '—'}
        </div>
      </div>

      {wo.status !== 'completed' && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          <h3 style={{ margin: '10px 0' }}>Complete with Note (optional)</h3>
          <textarea
            ref={noteRef}
            rows={4}
            placeholder="What was done / any follow-up"
            style={{ width: '100%', padding: 8, marginBottom: 10, resize: 'vertical' }}
          />
          {okMsg && <div style={{ color: 'seagreen', marginBottom: 10 }}>{okMsg}</div>}
          {err && <div style={{ color: 'crimson', marginBottom: 10 }}>{err}</div>}
          <button
            onClick={markCompleted}
            disabled={saving}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              background: saving ? '#aaa' : '#111',
              color: '#fff',
              border: 'none',
            }}
          >
            {saving ? 'Saving…' : 'Mark Completed'}
          </button>
        </div>
      )}

      {wo.status === 'completed' && (
        <div style={{ marginTop: 12, color: 'seagreen' }}>
          This work order is completed.
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
      <div style={{ color: '#555' }}>{label}</div>
      <div>{value}</div>
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
      return String(p || '—');
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
