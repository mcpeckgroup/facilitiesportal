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
  submitter_name?: string;
  submitter_email?: string;
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from("work_orders")
        .select("*")
        .neq("status", "completed");
      if (data) setRequests(data);
    }
    fetchRequests();
  }, []);

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
          <span className="px-4 py-2 bg-blue-600 text-white rounded">
            Open Requests
          </span>
        </Link>
        <Link href="/requests/completed">
          <span className="px-4 py-2 bg-gray-200 text-black rounded">
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

      {/* Request List */}
      <ul className="space-y-2">
        {filtered.map((req) => (
          <li key={req.id}>
            <Link href={`/requests/${req.id}`}>
              <span className="block p-3 bg-white rounded shadow hover:bg-gray-100 cursor-pointer">
                <strong>{req.title}</strong> – {req.business} – {req.priority}
                <div className="text-sm text-gray-600">
                  Submitted by: {req.submitter_name} ({req.submitter_email})
                </div>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
