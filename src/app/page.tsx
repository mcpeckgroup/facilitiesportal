// src/app/page.tsx
"use client";

import Link from "next/link";
import TenantHeader from "@/app/_components/TenantHeader";

export default function HomePage() {
  function goToSubdomainLogin() {
    const { origin, pathname, search } = window.location;
    // Build a URL that always causes a navigation, even if you're already on "/"
    const hasQuery = search && search.length > 1;
    const sep = hasQuery ? "&" : "?";
    const loginUrl = `${origin}/${pathname === "/" ? "" : ""}${hasQuery ? search : ""}${sep}login=1&ts=${Date.now()}`;
    window.location.assign(loginUrl);
  }

  return (
    <main>
      {/* Tenant-specific logo/name header */}
      <TenantHeader />

      {/* Content container */}
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Action bar (New Request + Login only) */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/requests/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition pointer-events-auto"
          >
            New Request
          </Link>

          <button
            type="button"
            onClick={goToSubdomainLogin}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition pointer-events-auto"
          >
            Login
          </button>
        </div>

        {/* Optional: read ?login=1 here to show a banner/modal */}
        {/* You can add a small message if the URL has login=1 */}

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
