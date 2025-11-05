"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; slug: string; name: string };

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  created_at: string;
  request_number?: number;
  company_id?: string;
  notes_preview?: string | null;
  notes_count?: number | null;
};

export default function RequestsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [filterPriority, setFilterPriority] = useState("");
  const [loading, setLoading] = useState(true);

  // Resolve company by subdomain
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/by-host", { cache: "no-store" });
        if (!res.ok) throw new Error("Company resolve failed");
        const data = (await res.json()) as Company;
        if (!cancelled) setCompany(data);
      } catch {
        if (!cancelled) setCompany(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load + realtime once company known
  useEffect(() => {
    if (!company) return;
    setLoading(true);

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("company_id", company.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!error && data) setRequests(data as WorkOrder[]);
      setLoading(false);
    }

    load();

    channel = supabase
      .channel(`open-requests-${company.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
          filter: `company_id=eq.${company.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [company]);

  const filtered = requests.filter((r) => (filterPriority ? r.priority === filterPriority : true));

  return (
    <div className="p-6">
      {/* Tabs + Sign out */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/requests" className="px-4 py-2 bg-blue-600 text-white rounded">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">
          Completed Requests
        </Link>
        <div className="flex-1" />
        <Link
          href="/auth/sign-out"
          className="px-3 py-2 rounded bg-gray-200 text-gray-900 shadow hover:bg-gray-300 transition"
        >
          Sign out
        </Link>
      </div>

      {/* Filters + New */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border p-2 rounded"
          disabled={loading}
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>

        <Link
          href="/requests/new"
          className="ml-auto px-4 py-2 rounded bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          New Request
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((req) => (
            <div key={req.id} className="border rounded-lg p-4 shadow">
              <h2 className="text-lg font-bold">
                <Link href={`/requests/${req.id}`}>{req.title}</Link>
              </h2>
              <p className="mb-1">{req.description}</p>
              <p className="text-sm text-gray-600">
                Priority: {req.priority}
                {typeof req.request_number === "number" ? ` | #${req.request_number}` : null}
              </p>
              <p className="text-sm text-gray-600">
                Submitted by: {req.submitter_name} ({req.submitter_email})
              </p>
              <p className="text-sm text-gray-600">
                Submitted at: {new Date(req.created_at).toLocaleString()}
              </p>
              {req.notes_count ? (
                <p className="text-sm text-gray-500 mt-1">
                  Notes: {req.notes_count} {req.notes_preview ? `— ${req.notes_preview}` : ""}
                </p>
              ) : null}
            </div>
          ))}
          {!filtered.length && <p className="text-gray-600">No open requests.</p>}
        </div>
      )}
    </div>
  );
}
