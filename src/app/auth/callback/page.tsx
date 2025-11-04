"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Handles both hash (#access_token…) and code exchange where applicable
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
          return;
        }

        // If there’s no session yet, try to recover (some providers use code in URL)
        if (!data.session) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exErr) {
            setError(exErr.message);
            return;
          }
        }

        if (!cancelled) {
          // Clean URL (drop query/hash) and go home on THIS subdomain
          window.history.replaceState({}, "", "/");
          window.location.assign("/");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Login failed.");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Signing you in…</h1>
      <p className="text-gray-600">Please wait.</p>
      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}
    </div>
  );
}
