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
  created_at: string;
  completed_at: string | null;
  completion_note: string | null;
  status: string;
  request_number?: number; // NEW
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // initial fetch
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });
      if (!error && data) setRequests(data as WorkOrder[]);
    })();
  }, []);

  // realtime for completed
  useEffect(() => {
    const channel = supabase
      .channel("work_orders_completed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_orders" },
        (payload) => {
          const row = payload.new as WorkOrder;
          if (!row) return;
          setRequests((prev) => {
            const filtered = prev.filter((r) => r.id !== row.id);
            if (row.status === "completed") {
              return [row, ...filtered].sort((a, b) => {
                const A = a.completed_at ? +new Date(a.completed_at) : 0;
                const B = b.completed_at ? +new Date(b.completed_at) : 0;
                return B - A;
              });
            }
            return filtered; // remove if reopened
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          (filterBusiness ? req.business === filterBusiness : true) &&
          (filterPriority ? req.priority === filterPriority : true)
      ),
    [requests, filterBusiness, filterPriority]
  );

  async function handleDelete(id: string) {
    await supabase.from("work_orders").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6">
      {/* Tabs + New button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">
            Open Requests
          </Link>
          <Link href="/requests/completed" className="px-4 py-2 bg-blue-600 text-white rounded">
            Completed Requests
          </Link>
        </div>
        <Link href="/requests/new" className="px-4 py-2 bg-green-600 text-white rounded">
          + New Request
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

      {/* Cards */}
      <div className="grid gap-4">
        {filteredRequests.map((req) => (
          <div key={req.id} className="border rounded-lg p-4 shadow">
            <h2 className="text-lg font-bold">
              <Link href={`/requests/${req.id}`}>
                {typeof req.request_number === "number" ? `[ #${req.request_number} ] ` : ``}
                {req.title}
              </Link>
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
            {req.completed_at && (
              <p className="text-sm text-gray-600">
                Completed at: {new Date(req.completed_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={() => handleDelete(req.id)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
