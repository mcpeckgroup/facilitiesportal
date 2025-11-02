// src/app/page.tsx
import Link from "next/link";
import TenantHeader from "@/app/_components/TenantHeader";

export default function HomePage() {
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
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            New Request
          </Link>

          {/* Login goes to the apex login page */}
          <a
            href="https://www.facilitiesportal.com/"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition"
          >
            Login
          </a>
        </div>

        {/* Minimal Facilitiesportal */}
        <section className="mt-2">
          <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
          <p className="text-gray-600">
            Submit a new facilities request or log in.
          </p>
        </section>
      </div>
    </main>
  );
}
