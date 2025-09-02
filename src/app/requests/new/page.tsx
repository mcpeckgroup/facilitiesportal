'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type Priority='emergency'|'urgent'|'non_critical'|'routine'|'preventive';
type Exec='in_house'|'contractor';

export default function NewRequestPage() {
  const router = useRouter();
  const [title,setTitle]=useState(''); const [location,setLocation]=useState('');
  const [requestedByName,setRequestedByName]=useState(''); const [priority,setPriority]=useState<Priority>('routine');
  const [description,setDescription]=useState(''); const [exec,setExec]=useState<Exec>('in_house');
  const [poNumber,setPoNumber]=useState(''); const [poNA,setPoNA]=useState(false);
  const [error,setError]=useState<string|null>(null); const [saving,setSaving]=useState(false);

  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); setError(null); setSaving(true);
    const { data:{ user } } = await supabase.auth.getUser(); if(!user) return router.replace('/login');
    const { error } = await supabase.from('work_orders').insert({
      requester: user.id,
      title: title || `${location||'Request'} • ${priority}`,
      details: description,
      description, location,
      requested_by_user: user.id, requested_by_name: requestedByName || user.email,
      priority, execution: exec, po_number: poNA?null:poNumber, po_na: poNA
    });
    setSaving(false); if(error) setError(error.message); else router.push('/requests');
  };

  return (
    <main style={{padding:24,maxWidth:720,margin:'0 auto'}}>
      <h1 style={{fontSize:24,fontWeight:600,marginBottom:16}}>New Maintenance Request</h1>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <input placeholder="Title (e.g., RTU leaking)" value={title} onChange={e=>setTitle(e.target.value)} style={{padding:10}} />
        <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} style={{padding:10}} />
        <input placeholder="Requested by" value={requestedByName} onChange={e=>setRequestedByName(e.target.value)} style={{padding:10}} />
        <label>Priority</label>
        <select value={priority} onChange={e=>setPriority(e.target.value as Priority)} style={{padding:10}}>
          <option value="emergency">Emergency</option><option value="urgent">Urgent</option>
          <option value="non_critical">Non-critical</option><option value="routine">Routine</option>
          <option value="preventive">Preventive</option>
        </select>
        <textarea placeholder="Request description" value={description} onChange={e=>setDescription(e.target.value)} style={{padding:10,minHeight:120}} />
        <label>Work to be performed</label>
        <div style={{display:'flex',gap:16}}>
          <label><input type="radio" checked={exec==='in_house'} onChange={()=>setExec('in_house')}/> In-house</label>
          <label><input type="radio" checked={exec==='contractor'} onChange={()=>setExec('contractor')}/> Contractor</label>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <input placeholder="PO #" value={poNumber} onChange={e=>setPoNumber(e.target.value)} style={{padding:10,flex:1}} disabled={poNA}/>
          <label><input type="checkbox" checked={poNA} onChange={()=>setPoNA(!poNA)}/> PO N/A</label>
        </div>
        {error && <p style={{color:'red'}}>{error}</p>}
        <button type="submit" disabled={saving} style={{padding:'10px 14px',borderRadius:8}}>{saving?'Submitting…':'Submit request'}</button>
      </form>
    </main>
  );
}
