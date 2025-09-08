// src/components/SignOut.tsx
'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SignOut() {
  const router = useRouter();

  async function onSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <button
      onClick={onSignOut}
      className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
      type="button"
    >
      Sign out
    </button>
  );
}
