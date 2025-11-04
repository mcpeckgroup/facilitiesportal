// src/app/auth/sign-out/page.tsx
"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import TenantHeader from "@/app/_components/TenantHeader";

export default function SignOutPage() {
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut().catch(() => {});
      window.location.assign("/");
    })();
  }, []);

  return (
    <main>
      <TenantHeader />
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Signing you out…</h1>
        <p className="text-gray-600">Please wait.</p>
      </div>
    </main>
  );
}
