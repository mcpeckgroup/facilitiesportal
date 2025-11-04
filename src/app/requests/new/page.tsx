"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; slug: string; name: string };

export default function NewRequestPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("routine");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // 1) Resolve company from subdomain (api/company/by-host)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/by-host", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not resolve company from host.");
        const data = (await res.json()) as Company;
        if (!cancelled) setCompany(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Company lookup failed.");
      } finally {
        if (!cancelled) setLoadingCompany(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!company) {
      setError("Company not resolved. Try reloading the page.");
      return;
    }

    if (!title.trim() || !description.trim() || !submitterName.trim() || !submitterEmail.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 2) Insert with company_id
      const { error: insertErr } = await supabase.from("work_orders").insert([
        {
          title: title.trim(),
          description: description.trim(),
          priority, // "emergency" | "urgent" | "non_critical" | "routine"
          submitter_name: submitterName.trim(),
          submitter_email: submitterEmail.trim(),
          status: "open",
          company_id: company.id, // <-- the key to tenant scoping
        },
      ]);

      if (insertErr) {
        setError(insertErr.message);
        setSubmitting(false);
        return;
      }

      // (optional) If you’ve wired Resend via /api/notify-new-request, notify:
      try {
        await fetch("/api/notify-new-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            record: {
              title,
              description,
              priority,
              submitter_name: submitterName,
              submitter_email: submitterEmail,
              created_at: new Date().toISOString(),
              company_name: company.name,
              company_slug: company.slug,
            },
          }),
        });
      } catch {
        // non-blocking
      }

      setOk(true);
      // 3) Send back to the home of the current subdomain
      window.location.assign("/");
    } catch (e: any) {
      setError(e?.message || "Failed to submit request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <a href="/requests" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
          Back to Open Requests
        </a>
        <a href="/requests/completed" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
          Completed Requests
        </a>
        <div className="flex-1" />
        <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
          Sign out
        </a>
      </div>

      <h1 className="text-2xl font-semibold mb-4">New Request</h1>

      {loadingCompany && <p className="text-gray-600 mb-3">Resolving company…</p>}
      {company && (
        <p className="text-sm text-gray-600 mb-4">
          Company: <strong>{company.name}</strong>
        </p>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 p-3">
          Request submitted.
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 border rounded-lg p-5 bg-white shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            className="w-full border rounded p-2 h-28"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Keep same layout: no Business dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority *</label>
          <select
            className="w-full border rounded p-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name *</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your Email *</label>
            <input
              type="email"
              className="w-full border rounded p-2"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || loadingCompany || !company}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>

          <a
            href="/"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
