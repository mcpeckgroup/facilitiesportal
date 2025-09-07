// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Read from env (must be set in Vercel project settings)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Fail fast with a clear message during build if envs are missing
if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

// Single browser client shared across your app
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Optional helper to satisfy imports that expect getSupabase()
export function getSupabase() {
  return supabase;
}
