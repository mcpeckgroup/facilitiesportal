// src/app/page.tsx
"use client";

import Link from "next/link";
import TenantHeader from "@/app/_components/TenantHeader";

export default function HomePage() {
  return (
    <main>
      <TenantHeader />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/requests/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            New Request
          </Link>

          {/* Go to subdomain-specific login page */}
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition"
          >
            Login
          </Link>
        </div>

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
