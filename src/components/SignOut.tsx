'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';

export default function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
      style={{padding:'8px 12px',borderRadius:8}}
    >
      Sign out
    </button>
  );
}
