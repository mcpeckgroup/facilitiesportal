'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  title: string;
  details: string | null;
  status: string | null;
  priority: string | null;
  location: string | null;
  created_at: string | null;
  requested_by_name: string | null;
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wo, setWO] = useState<WO | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('work_orders')
        .select('id,title,details,status,priority,location,created_at,requested_by_name')
        .eq('id', id)
        .single();
      if (error) {
        alert(error.message);
      } else {
        setWO(data as WO);
      }
      setLoading(false);
    }
    run();
  }, [id, router]);

  async function markComplete() {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'completed',
          details: note ? `${wo?.details ? wo?.details + '\n\n' : ''}Completion note: ${note}` : wo?.details
        })
        .eq('id', id);
      if (error) throw error;
      alert('Marked completed');
      router.push('/requests');
    } catch (err: any) {
      alert(err?.message || 'Failed to update');
    }
  }

  if (loading) return <div style={{maxWidth:800, margin:'40px auto', padding:24}}>Loading…</div>;
  if (!wo) return <div style={{maxWidth:800, margin:'40px auto', padding:24}}>Not found.</div>;

  return (
    <div style={{maxWidth: 800, margin:'40px auto', padding:24}}>
      <a href="/requests" style={{textDecoration:'none'}}>&larr; Back to list</a>
      <h1 style={{fontSize:24, fontWeight:700, marginTop:8}}>{wo.title}</h1>
      <div style={{color:'#666', fontSize:13, marginTop:4}}>
        {wo.location ? `${wo.location} · ` : ''}{wo.priority ?? '—'} · {wo.status ?? 'open'} · {wo.created_at ? new Date(wo.created_at).toLocaleString() : ''}
      </div>

      {wo.details && (
        <pre style={{whiteSpace:'pre-wrap', background:'#fafafa', border:'1px solid #eee', padding:12, borderRadius:8, marginTop:12}}>
{wo.details}
        </pre>
      )}

      <div style={{marginTop:16, borderTop:'1px solid #eee', paddingTop:16}}>
        <label>
          <div style={{fontSize:12, color:'#444'}}>Completion note (optional)</div>
          <textarea
            rows={4}
            value={note}
            onChange={(e)=>setNote(e.target.value)}
            style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
          />
        </label>
        <div style={{display:'flex', gap:8, marginTop:10}}>
          <button onClick={markComplete} style={{padding:'10px 12px', borderRadius:8, background:'#111', color:'#fff', border:'1px solid #111'}}>
            Mark Completed
          </button>
          <a href="/requests" style={{padding:'10px 12px', borderRadius:8, border:'1px solid #111', textDecoration:'none'}}>Cancel</a>
        </div>
      </div>
    </div>
  );
}
