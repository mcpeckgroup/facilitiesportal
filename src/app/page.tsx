import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-semibold">Facilities Portal</h1>
        <p className="text-slate-600">Submit a new request or log in to view/manage work orders.</p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/requests/new"
            className="px-5 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            New Request
          </Link>

          <Link
            href="/login"
            className="px-5 py-3 rounded-md border border-slate-300 hover:bg-slate-100 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
