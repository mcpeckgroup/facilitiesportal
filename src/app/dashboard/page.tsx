'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="flex gap-2">
        <Link href="/requests" className="px-3 py-2 rounded-md border hover:bg-gray-50">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-3 py-2 rounded-md border hover:bg-gray-50">
          Completed Requests
        </Link>
      </div>

      <p className="text-gray-600">
        Use the tabs above to view open or completed work orders. Mark a work order as
        <em> completed</em> from its detail page; it will automatically appear under “Completed Requests”.
      </p>
    </div>
  );
}
