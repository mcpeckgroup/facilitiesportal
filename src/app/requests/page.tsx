'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

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

export default function RequestsListPage() {
  const [items, setItems] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        setItems(data as WO[]);
      }
      setLoading(false);
    }
    run();
  }, [router]);

  return (
    <div style={{maxWidth: 960, margin:'40px auto', padding:24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontSize: 24, fontWeight:700}}>Work Orders</h1>
        <div style={{display:'flex', gap:8}}>
          <a href="/requests/new" style={{padding:'8px 10px', borderRadius:8, background:'#111', color:'#fff', textDecoration:'none'}}>New</a>
          <a href="/dashboard" style={{padding:'8px 10px', borderRadius:8, border:'1px solid #111', textDecoration:'none'}}>Dashboard</a>
        </div>
      </div>

      {loading ? (
        <p style={{marginTop:16}}>Loading…</p>
      ) : (
        <div style={{marginTop:16, display:'grid', gap:10}}>
          {items.length === 0 && <p>No requests yet.</p>}
          {items.map((wo) => (
            <a
              key={wo.id}
              href={`/requests/${wo.id}`}
              style={{display:'block', padding:12, border:'1px solid #ddd', borderRadius:10, textDecoration:'none', color:'inherit'}}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                <div>
                  <div style={{fontWeight:600}}>{wo.title}</div>
                  <div style={{fontSize:12, color:'#666'}}>
                    {wo.location ? `${wo.location} · ` : ''}{wo.priority ?? '—'} · {wo.status ?? 'open'}
                  </div>
                </div>
                <div style={{fontSize:12, color:'#888'}}>
                  {wo.created_at ? new Date(wo.created_at).toLocaleString() : ''}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
