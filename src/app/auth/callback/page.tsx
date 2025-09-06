'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../../lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        // This only runs in the browser.
        await supabase.auth.exchangeCodeForSession(window.location.href);
      } catch {
        // ignore – we'll redirect anyway
      } finally {
        router.replace('/requests');
      }
    })();
  }, [router]);

  return <main className="p-6">Signing you in…</main>;
}
