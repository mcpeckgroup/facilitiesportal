'use client';

import { /* your imports here */ } from '...';
// other imports...

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ...rest of the file...
export const dynamic = 'force-dynamic';
export const revalidate = 0;
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function LoginPage() {
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [err,setErr]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  const router=useRouter();

  const go=async()=>{ setErr(null); setLoading(true);
    try{
      const { error } = mode==='signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    }catch(e:any){ setErr(e?.message||'Auth failed'); } finally{ setLoading(false); }
  };

  return(
    <main style={{minHeight:'80vh',display:'grid',placeItems:'center',padding:24}}>
      <div style={{maxWidth:420,width:'100%'}}>
        <h1 style={{fontSize:24,fontWeight:600,marginBottom:12}}>
          {mode==='signin'?'Sign in':'Create account'}
        </h1>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <button onClick={()=>setMode('signin')} style={{padding:'8px 12px',border:mode==='signin'?'2px solid #111':'1px solid #ccc',borderRadius:8}}>Sign in</button>
          <button onClick={()=>setMode('signup')} style={{padding:'8px 12px',border:mode==='signup'?'2px solid #111':'1px solid #ccc',borderRadius:8}}>Sign up</button>
        </div>
        <input type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:10,marginBottom:8,border:'1px solid #ddd',borderRadius:8}}/>
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:10,marginBottom:8,border:'1px solid #ddd',borderRadius:8}}/>
        <button disabled={loading} onClick={go} style={{padding:'10px 14px',borderRadius:8}}>{loading?'Please wait…':(mode==='signin'?'Sign in':'Sign up')}</button>
        {err && <p style={{color:'red',marginTop:8}}>{err}</p>}
      </div>
    </main>
  );
}
