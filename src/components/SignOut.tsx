'use client';

import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase/client';

export default function SignOut() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      // Optional: console.error(e);
    } finally {
      router.push('/login');
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="px-3 py-2 rounded border hover:bg-gray-50"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}
