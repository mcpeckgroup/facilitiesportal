export const dynamic = 'force-dynamic';
export const revalidate = 0;
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type WO = {
  id: string;
  wo_number: string | null;
  title: string | null;
  details: string | null;
  description: string | null;
  location: string | null;
  priority: string | null;
  status: string | null;
  execution: string | null;
  po_number: string | null;
  po_na: boolean | null;
  created_at: string;
  requested_by_name: string | null;
  completed_at?: string | null;
  completed_note?: string | null;
};

type Note = {
  id: string;
  work_order_id: string;
  author: string | null;
  note: string;
  created_at: string;
};

type Photo = {
  id: string;
  work_order_id: string;
  path: string;
  uploaded_by: string | null;
  created_at: string;
};

export default function WorkOrderDetail() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = (params?.id ?? '') as string;

  const [wo, setWO] = useState<WO | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // notes + complete inputs
  const [newNote, setNewNote] = useState('');
  const [completeNote, setCompleteNote] = useState('');

  // edit fields
  const [editMode, setEditMode] = useState(false);
  const [eTitle, setETitle] = useState(''); 
  const [eLocation, setELocation] = useState('');
  const [ePriority, setEPriority] = useState<WO['priority']>('routine');
  const [eStatus, setEStatus] = useState<WO['status']>('new');
  const [eDesc, setEDesc] = useState('');
  const [eExec, setEExec] = useState<WO['execution']>('in_house');
  const [ePO, setEPO] = useState('');
  const [ePONA, setEPONA] = useState(false);

  const bucket = useMemo(()=>supabase.storage.from('wo-photos'),[]);

  const reload = async () => {
    setErr(null); setLoading(true);
    const { data:{ user } } = await supabase.auth.getUser();
    if(!user) { router.replace('/login'); return; }

    const { data: woRow, error: woErr } = await supabase
      .from('work_orders').select('*').eq('id', id).single();
    if (woErr) { setErr(woErr.message); setLoading(false); return; }

    setWO(woRow as WO);
    setETitle(woRow?.title ?? '');
    setELocation(woRow?.location ?? '');
    setEPriority((woRow?.priority ?? 'routine') as WO['priority']);
    setEStatus((woRow?.status ?? 'new') as WO['status']);
    setEDesc(woRow?.description ?? woRow?.details ?? '');
    setEExec((woRow?.execution ?? 'in_house') as WO['execution']);
    setEPO(woRow?.po_number ?? '');
    setEPONA(Boolean(woRow?.po_na));

    const { data: noteRows } = await supabase
      .from('work_order_notes').select('*').eq('work_order_id', id).order('created_at', { ascending: true });
    setNotes(noteRows || []);

    const { data: photoRows } = await supabase
      .from('work_order_photos').select('*').eq('work_order_id', id).order('created_at', { ascending: true });
    setPhotos(photoRows || []);

    setLoading(false);
  };

  useEffect(()=>{ reload(); /* eslint-disable-next-line */ }, [id]);

  const publicUrlFor = (path:string) => {
    const { data } = bucket.getPublicUrl(path);
    return data.publicUrl;
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setBusy(true); setErr(null);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) { router.replace('/login'); return; }
      const { data, error } = await supabase
        .from('work_order_notes')
        .insert({ work_order_id: id, author: user.id, note: newNote })
        .select('*').single();
      if (error) throw error;
      setNotes(prev => [...prev, data as Note]);
      setNewNote('');
    } catch (e:any) { setErr(e?.message || 'Failed to add note'); }
    finally { setBusy(false); }
  };

  const markComplete = async () => {
    if (!completeNote.trim()) { setErr('Please enter a completion note.'); return; }
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.from('work_orders').update({
        status: 'completed', completed_at: new Date().toISOString(), completed_note: completeNote
      }).eq('id', id);
      if (error) throw error;

      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('work_order_notes').insert({
          work_order_id: id, author: user.id, note: `Completed: ${completeNote}`
        });
      }
      await reload();
      setCompleteNote('');
    } catch (e:any) { setErr(e?.message || 'Failed to complete work order'); }
    finally { setBusy(false); }
  };

  const saveEdits = async () => {
    setBusy(true); setErr(null);
    try{
      const upd = {
        title: eTitle || null,
        location: eLocation || null,
        priority: ePriority || null,
        status: eStatus || null,
        description: eDesc || null,
        execution: eExec || null,
        po_number: ePONA ? null : (ePO || null),
        po_na: ePONA
      };
      const { error } = await supabase.from('work_orders').update(upd).eq('id', id);
      if (error) throw error;
      setEditMode(false);
      await reload();
    }catch(e:any){ setErr(e?.message || 'Failed to save'); }
    finally{ setBusy(false); }
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true); setErr(null);
    try{
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) { router.replace('/login'); return; }
      for (const file of Array.from(files)) {
        const path = `${id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await bucket.upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        await supabase.from('work_order_photos').insert({ work_order_id: id, path, uploaded_by: user.id });
      }
      await reload();
    }catch(e:any){ setErr(e?.message || 'Upload failed'); }
    finally{ setBusy(false); }
  };

  if (loading) return <main style={{padding:24}}>Loading…</main>;
  if (err) return <main style={{padding:24,color:'red'}}>Error: {err}</main>;
  if (!wo) return <main style={{padding:24}}>Not found</main>;

  return (
    <main style={{padding:24, maxWidth: 980, margin: '0 auto', display:'grid', gap: 16}}>
      <a href="/requests" style={{textDecoration:'underline'}}>← Back to list</a>

      <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
        <h1 style={{margin:0}}>{wo.wo_number ?? wo.id.slice(0,8)} — {wo.title}</h1>
        <p style={{margin:'8px 0'}}>
          <strong>Status:</strong> {wo.status ?? 'new'}
          {wo.completed_at && <> • <strong>Completed at:</strong> {new Date(wo.completed_at).toLocaleString()}</>}
        </p>
        <p style={{margin:'8px 0'}}><strong>Priority:</strong> {wo.priority ?? '—'} • <strong>Exec:</strong> {wo.execution ?? '—'}</p>
        <p style={{margin:'8px 0'}}><strong>Location:</strong> {wo.location ?? '—'}</p>
        <p style={{margin:'8px 0'}}><strong>Requested by:</strong> {wo.requested_by_name ?? '—'}</p>
        <p style={{margin:'8px 0'}}><strong>Description:</strong><br/>{wo.description ?? wo.details ?? '—'}</p>
        {wo.po_na ? <p><strong>PO:</strong> N/A</p> : <p><strong>PO:</strong> {wo.po_number ?? '—'}</p>}
        {wo.completed_note && (
          <p style={{margin:'8px 0', background:'#fafafa', padding:12, borderRadius:8}}>
            <strong>Completion note:</strong><br/>{wo.completed_note}
          </p>
        )}
      </section>

      {/* Edit fields */}
      <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{marginTop:0}}>Edit fields</h2>
          {!editMode
            ? <button onClick={()=>setEditMode(true)} style={{padding:'6px 10px',borderRadius:8}}>Edit</button>
            : <button onClick={()=>setEditMode(false)} style={{padding:'6px 10px',borderRadius:8}}>Cancel</button>}
        </div>
        {editMode && (
          <div style={{display:'grid',gap:10}}>
            <input placeholder="Title" value={eTitle} onChange={e=>setETitle(e.target.value)} style={{padding:10}} />
            <input placeholder="Location" value={eLocation} onChange={e=>setELocation(e.target.value)} style={{padding:10}} />
            <label>Priority</label>
            <select value={ePriority ?? 'routine'} onChange={e=>setEPriority(e.target.value as any)} style={{padding:10}}>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="non_critical">Non-critical</option>
              <option value="routine">Routine</option>
              <option value="preventive">Preventive</option>
            </select>
            <label>Status</label>
            <select value={eStatus ?? 'new'} onChange={e=>setEStatus(e.target.value as any)} style={{padding:10}}>
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
            <label>Execution</label>
            <select value={eExec ?? 'in_house'} onChange={e=>setEExec(e.target.value as any)} style={{padding:10}}>
              <option value="in_house">In-house</option>
              <option value="contractor">Contractor</option>
            </select>
            <textarea placeholder="Description / Details" value={eDesc} onChange={e=>setEDesc(e.target.value)} style={{padding:10,minHeight:100}} />
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <input placeholder="PO #" value={ePO} onChange={e=>setEPO(e.target.value)} style={{padding:10,flex:1}} disabled={ePONA}/>
              <label><input type="checkbox" checked={ePONA} onChange={()=>setEPONA(!ePONA)}/> PO N/A</label>
            </div>
            <button disabled={busy} onClick={saveEdits} style={{padding:'8px 12px',borderRadius:8}}>
              {busy?'Saving…':'Save changes'}
            </button>
          </div>
        )}
      </section>

      {/* Notes */}
      <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
        <h2 style={{marginTop:0}}>Notes</h2>
        {notes.length === 0 && <p>No notes yet.</p>}
        <ul style={{listStyle:'none', padding:0, display:'grid', gap:8}}>
          {notes.map(n => (
            <li key={n.id} style={{border:'1px solid #f0f0f0', borderRadius:8, padding:10}}>
              <div style={{fontSize:12, opacity:.7}}>{new Date(n.created_at).toLocaleString()}</div>
              <div>{n.note}</div>
            </li>
          ))}
        </ul>
        <div style={{display:'grid', gap:8, marginTop:12}}>
          <textarea placeholder="Add a note…" value={newNote} onChange={e=>setNewNote(e.target.value)} style={{padding:10, minHeight:80}} />
          <button disabled={busy} onClick={addNote} style={{padding:'8px 12px', borderRadius:8}}>
            {busy ? 'Please wait…' : 'Add note'}
          </button>
        </div>
      </section>

      {/* Photos */}
      <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
        <h2 style={{marginTop:0}}>Photos</h2>
        <input type="file" accept="image/*" multiple onChange={e=>uploadPhotos(e.target.files)} />
        {photos.length===0 ? <p style={{marginTop:8}}>No photos yet.</p> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',gap:10,marginTop:12}}>
            {photos.map(p=>{
              const url = publicUrlFor(p.path);
              return (
                <a key={p.id} href={url} target="_blank" rel="noreferrer" style={{display:'block',border:'1px solid #eee',borderRadius:8,overflow:'hidden'}}>
                  <img src={url} alt="WO photo" style={{width:'100%',height:140,objectFit:'cover'}}/>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Complete action */}
      {wo.status !== 'completed' && (
        <section style={{border:'1px solid #eee', borderRadius:12, padding:16}}>
          <h2 style={{marginTop:0}}>Mark Complete</h2>
          <textarea
            placeholder="Completion note (required)"
            value={completeNote}
            onChange={e=>setCompleteNote(e.target.value)}
            style={{padding:10, minHeight:80}}
          />
          <div style={{marginTop:8}}>
            <button disabled={busy} onClick={markComplete} style={{padding:'10px 14px', borderRadius:8}}>
              {busy ? 'Completing…' : 'Mark as Complete'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
