'use client';

import { createClient } from '@supabase/supabase-js';

// If you have generated DB types, replace `any` with them.
type Database = any;

/**
 * Browser Supabase client
 * - Uses public anon key
 * - Persists session in the browser
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabase;
