'use client';
import SignOut from '../../components/SignOut';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
<p style={{marginTop:12}}><SignOut /></p>

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? null);
      setReady(true);
    })();
  }, [router]);

  if (!ready) return <main style={{ padding: 24 }}>Loading…</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Dashboard</h1>
      <p>Welcome{email ? `, ${email}` : ''}.</p>
      <p><a href="/requests" style={{ textDecoration: 'underline' }}>View requests</a> •{' '}
         <a href="/requests/new" style={{ textDecoration: 'underline' }}>New request</a></p>
    </main>
  );
}
