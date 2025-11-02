// src/app/page.tsx
import TenantHeader from "@/app/_components/TenantHeader";

export default function HomePage() {
  return (
    <main>
      {/* Tenant-specific logo/name header */}
      <TenantHeader />

      {/* 👇 Keep your existing home page content inside this container */}
      <div className="p-6 max-w-5xl mx-auto">
        {/* TODO: paste your current home page JSX here if this file was empty */}
        {/* Example (remove if you already have content):
        <h1 className="text-2xl font-semibold mb-4">Welcome</h1>
        <p className="text-gray-600">Choose an action from the menu.</p>
        */}
      </div>
    </main>
  );
}
