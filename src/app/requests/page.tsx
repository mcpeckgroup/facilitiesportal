'use client';

import { /* your imports here */ } from '...';
// other imports...

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ...rest of the file...
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

type WO = {
  id:string; wo_number:string|null; title:string|null; location:string|null;
  priority:string|null; status:string|null; created_at:string; requested_by_name:string|null;
};

type Filter = 'all'|'open'|'completed';

export default function RequestsList(){
  const router=useRouter();
  const [rows,setRows]=useState<WO[]>([]);
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState<Filter>('open'); // default to Open

  useEffect(()=>{ (async()=>{
    setLoading(true); setErr(null);
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) return router.replace('/login');

    let q = supabase
      .from('work_orders')
      .select('id, wo_number, title, location, priority, status, created_at, requested_by_name')
      .order('created_at',{ascending:false})
      .limit(200);

    if (filter==='completed') q = q.eq('status','completed');
    if (filter==='open') q = q.neq('status','completed').or('status.is.null');

    const { data, error } = await q;
    if(error) setErr(error.message);
    setRows(data ?? []);
    setLoading(false);
  })(); },[router, filter]);

  if(loading) return <main style={{padding:24}}>Loading…</main>;

  return (
    <main style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:600,marginBottom:12}}>Requests</h1>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={()=>setFilter('all')}       style={{padding:'6px 10px',borderRadius:8,border: filter==='all'?'2px solid #111':'1px solid #ccc'}}>All</button>
        <button onClick={()=>setFilter('open')}      style={{padding:'6px 10px',borderRadius:8,border: filter==='open'?'2px solid #111':'1px solid #ccc'}}>Open</button>
        <button onClick={()=>setFilter('completed')} style={{padding:'6px 10px',borderRadius:8,border: filter==='completed'?'2px solid #111':'1px solid #ccc'}}>Completed</button>
        <div style={{marginLeft:'auto'}}><a href="/requests/new" style={{textDecoration:'underline'}}>+ New request</a></div>
      </div>

      {err && <p style={{color:'red'}}>Error: {err}</p>}
      <ul style={{display:'grid',gap:8,listStyle:'none',padding:0}}>
        {rows.map(wo=>(
          <li key={wo.id} style={{border:'1px solid #eee',borderRadius:10,padding:12}}>
            <a href={`/requests/${wo.id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>{wo.wo_number ?? wo.id.slice(0,8)}</strong>
                <span style={{fontSize:12,opacity:.7}}>{new Date(wo.created_at).toLocaleString()}</span>
              </div>
              <div style={{fontWeight:600}}>{wo.title ?? '(no title)'}</div>
              <div style={{fontSize:14}}>{(wo.priority??'').toUpperCase()} • {wo.status??'new'} • {wo.location??'No location'}</div>
              <div style={{fontSize:12,opacity:.7}}>Requested by: {wo.requested_by_name ?? '—'}</div>
            </a>
          </li>
        ))}
        {rows.length===0 && <li>No requests.</li>}
      </ul>
    </main>
  );
}
