"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  status: "open" | "completed" | string;
  created_at: string;
  completed_at: string | null;
  completion_note: string | null;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      if (!error && data && mounted) setRequests(data as WorkOrder[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Realtime subscription: INSERT/UPDATE/DELETE
  useEffect(() => {
    const channel = supabase
      .channel("work-orders-completed")
      // INSERT: add if status is completed
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_orders" },
        (payload) => {
          const row = payload.new as unknown as WorkOrder;
          if (row.status === "completed") {
            setRequests((prev) => {
              const exists = prev.some((p) => p.id === row.id);
              const next = exists ? prev.map((p) => (p.id === row.id ? row : p)) : [row, ...prev];
              return next.sort(
                (a, b) =>
                  +new Date(b.completed_at || b.created_at) -
                  +new Date(a.completed_at || a.created_at)
              );
            });
          }
        }
      )
      // UPDATE: move in/out of completed, or update fields
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "work_orders" },
        (payload) => {
          const row = payload.new as unknown as WorkOrder;
          setRequests((prev) => {
            const inCompleted = row.status === "completed";
            const exists = prev.some((p) => p.id === row.id);
            if (inCompleted) {
              const next = exists ? prev.map((p) => (p.id === row.id ? row : p)) : [row, ...prev];
              return next.sort(
                (a, b) =>
                  +new Date(b.completed_at || b.created_at) -
                  +new Date(a.completed_at || a.created_at)
              );
            } else {
              return exists ? prev.filter((p) => p.id !== row.id) : prev;
            }
          });
        }
      )
      // DELETE: remove from list
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "work_orders" },
        (payload) => {
          const oldRow = payload.old as unknown as WorkOrder;
          setRequests((prev) => prev.filter((p) => p.id !== oldRow.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () =>
      requests.filter((req) => {
        return (
          (filterBusiness ? req.business === filterBusiness : true) &&
          (filterPriority ? req.priority === filterPriority : true)
        );
      }),
    [requests, filterBusiness, filterPriority]
  );

  async function handleDelete(id: string) {
    await supabase.from("work_orders").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-4 py-2 bg-blue-600 text-white rounded">
          Completed Requests
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filtered.map((req) => (
          <div key={req.id} className="border rounded-lg p-4 shadow">
            <h2 className="text-lg font-bold">
              <Link href={`/requests/${req.id}`}>{req.title}</Link>
            </h2>
            <p>{req.description}</p>
            <p className="text-sm text-gray-600">
              Business: {req.business} | Priority: {req.priority}
            </p>
            <p className="text-sm text-gray-600">
              Submitted by: {req.submitter_name} ({req.submitter_email})
            </p>
            <p className="text-sm text-gray-600">
              Submitted at: {new Date(req.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Completed at: {req.completed_at ? new Date(req.completed_at).toLocaleString() : "—"}
            </p>
            <p className="text-sm italic">Completion Notes: {req.completion_note || "—"}</p>
            <button
              onClick={() => handleDelete(req.id)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500">No completed requests match your filters.</p>
        )}
      </div>
    </div>
  );
}
