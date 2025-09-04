export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Facilities Portal</h1>
      <p className="mb-6">Submit and manage work orders.</p>
      <a href="/login" className="underline mr-4">Login</a>
      <a href="/requests" className="underline">View Requests</a>
    </main>
  );
}
