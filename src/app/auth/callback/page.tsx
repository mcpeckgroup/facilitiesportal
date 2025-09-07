'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // If you later need to verify session, you can do it here.
    router.replace('/requests');
  }, [router]);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
      <p>Please wait while we finish authentication.</p>
    </main>
  );
}
