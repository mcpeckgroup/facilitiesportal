'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * IMPORTANT:
 * We DO NOT create the client at import time anymore.
 * Vercel’s build (prerender) imports modules without your envs,
 * so we only create the client when a browser actually runs the code.
 */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During local dev this will throw in the browser if you forgot .env.local.
  // During Vercel build, this code path won’t run (no window), and we return a proxy.
  if (!url || !anon) {
    if (typeof window !== 'undefined') {
      throw new Error(
        'Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    // Prevent server build from exploding if something accidentally tries to use it.
    return new Proxy(
      {},
      {
        get() {
          throw new Error('Supabase client used during build without env vars.');
        },
      }
    ) as any;
  }

  return createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } });
}
