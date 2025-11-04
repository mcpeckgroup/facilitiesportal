// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TenantHeader from "@/app/_components/TenantHeader";
import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancel) {
        setEmail(data.session?.user?.email ?? null);
        setChecking(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <main>
      <TenantHeader />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Auth status banner */}
        {!checking && (
          <div className="rounded-lg border bg-white p-3 text-sm text-gray-700 shadow-sm">
            {email ? (
              <span>Signed in as <strong>{email}</strong></span>
            ) : (
              <span>Not signed in</span>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/requests/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            New Request
          </Link>

          {email ? (
            <>
              <Link
                href="/requests"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white border shadow hover:bg-gray-50 transition"
              >
                Open Requests
              </Link>
              <Link
                href="/auth/sign-out"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition"
              >
                Sign out
              </Link>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Minimal welcome */}
        <section className="mt-2">
          <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
          <p className="text-gray-600">
            Use the buttons above to submit a new facilities request or to log in.
          </p>
        </section>
      </div>
    </main>
  );
}
