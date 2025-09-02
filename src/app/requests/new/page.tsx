'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'|'emergency'>('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login');
    });
  }, [router]);

  async function submitWO(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not signed in');

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          title,
          details: details || null,
          status: 'open',
          priority,
          location: location || null,
          requester: auth.user.id,
          requested_by_name: auth.user.email || null
        })
        .select('id')
        .single();
      if (error) throw error;

      router.push(`/requests/${data!.id}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{maxWidth: 720, margin:'40px auto', padding:24}}>
      <h1 style={{fontSize: 24, fontWeight:700}}>New Work Order</h1>

      <form onSubmit={submitWO} style={{marginTop:16, display:'grid', gap:12}}>
        <label>
          <div style={{fontSize:12, color:'#444'}}>Title</div>
          <input
            required
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
          />
        </label>

        <label>
          <div style={{fontSize:12, color:'#444'}}>Details</div>
          <textarea
            rows={5}
            value={details}
            onChange={(e)=>setDetails(e.target.value)}
            style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
          />
        </label>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <label>
            <div style={{fontSize:12, color:'#444'}}>Location</div>
            <input
              value={location}
              onChange={(e)=>setLocation(e.target.value)}
              style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
            />
          </label>

          <label>
            <div style={{fontSize:12, color:'#444'}}>Priority</div>
            <select
              value={priority}
              onChange={(e)=>setPriority(e.target.value as any)}
              style={{width:'100%', padding:'10px 12px', border:'1px solid #ccc', borderRadius:8}}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="emergency">emergency</option>
            </select>
          </label>
        </div>

        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button
            type="submit"
            disabled={submitting || !title}
            style={{padding:'10px 12px', borderRadius:8, background:'#111', color:'#fff', border:'1px solid #111'}}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          <a href="/requests" style={{padding:'10px 12px', borderRadius:8, border:'1px solid #111', textDecoration:'none'}}>Cancel</a>
        </div>
      </form>
    </div>
  );
}
