"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  business?: string;
  priority?: string;
  status: string;
  completion_note?: string;
  submitter_name?: string;
  submitter_email?: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed");
      if (data) setRequests(data);
    }
    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("work_orders").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = requests.filter((req) => {
    return (
      (businessFilter === "all" || req.business === businessFilter) &&
      (priorityFilter === "all" || req.priority === priorityFilter)
    );
  });

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Link href="/requests">
          <span className="px-4 py-2 bg-gray-200 text-black rounded">
            Open Requests
          </span>
        </Link>
        <Link href="/requests/completed">
          <span className="px-4 py-2 bg-blue-600 text-white rounded">
            Completed Requests
          </span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {/* Completed Requests List */}
      <ul className="space-y-2">
        {filtered.map((req) => (
          <li key={req.id} className="p-3 bg-white rounded shadow">
            <Link href={`/requests/${req.id}`}>
              <span className="block hover:underline cursor-pointer">
                <strong>{req.title}</strong> – {req.business} – {req.priority}
              </span>
            </Link>
            {req.completion_note && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Notes:</strong> {req.completion_note}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Submitted by: {req.submitter_name} ({req.submitter_email})
            </p>
            <button
              onClick={() => handleDelete(req.id)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
