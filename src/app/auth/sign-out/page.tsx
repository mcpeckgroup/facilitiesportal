// src/app/auth/sign-out/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import TenantHeader from "@/app/_components/TenantHeader";

function clearSupabaseStorage() {
  try {
    // Supabase v2 uses localStorage to persist the session
    // Clear the common keys or just clear all app storage
    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("sb-"); // noop if not present
    sessionStorage.removeItem("supabase.auth.token");
  } catch {}
}

export default function SignOutPage() {
  const [message, setMessage] = useState("Signing you out…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Global sign-out (revokes refresh token)
        await supabase.auth.signOut({ scope: "global" }).catch(() => {});

        // 2) Proactively clear storage (defensive)
        clearSupabaseStorage();

        // 3) Verify session is gone; if not, try once more
        const verify = await supabase.auth.getSession();
        if (verify.data.session) {
          await supabase.auth.signOut({ scope: "global" }).catch(() => {});
          clearSupabaseStorage();
        }

        if (!cancelled) {
          setMessage("Signed out. Redirecting…");
          // 4) Hard reload home on this subdomain to ensure fresh state
          // (replaceState to clean URL, then reload)
          window.history.replaceState({}, "", "/");
          // small delay to let storage clear settle
          setTimeout(() => window.location.replace("/"), 50);
        }
      } catch (e) {
        if (!cancelled) {
          setMessage("Sign-out completed. Redirecting…");
          window.history.replaceState({}, "", "/");
          setTimeout(() => window.location.replace("/"), 50);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <TenantHeader />
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-2">{message}</h1>
        <p className="text-gray-600">Please wait.</p>
      </div>
    </main>
  );
}
