'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login');
      } else {
        setUserEmail(data.user.email ?? null);
      }
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div style={{maxWidth: 900, margin: '40px auto', padding: 24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{fontSize: 28, fontWeight: 700}}>Facilities Portal</h1>
        <div>
          <span style={{marginRight: 12, color: '#555'}}>{userEmail}</span>
          <button onClick={signOut} style={{border:'1px solid #ccc', padding:'6px 10px', borderRadius:8}}>Sign out</button>
        </div>
      </div>

      <div style={{marginTop: 24, display:'flex', gap: 12}}>
        <a href="/requests/new" style={{padding:'10px 12px', borderRadius:8, background:'#111', color:'#fff', textDecoration:'none'}}>New Request</a>
        <a href="/requests" style={{padding:'10px 12px', borderRadius:8, border:'1px solid #111', textDecoration:'none'}}>View Requests</a>
      </div>
    </div>
  );
}
