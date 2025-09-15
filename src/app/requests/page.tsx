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
  const [businessFilter, setBusinessFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from("work_orders")
        .select("*")
        .neq("status", "completed")
        .order("id", { ascending: false });

      if (data) setRequests(data);
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    return (
      (!businessFilter || r.business === businessFilter) &&
      (!priorityFilter || r.priority === priorityFilter)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Open Requests</h1>

      {/* Tabs */}
      <div className="mb-4 space-x-4">
        <Link
          href="/requests"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Open Requests
        </Link>
        <Link
          href="/requests/completed"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Completed Requests
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {/* Request List */}
      <ul>
        {filteredRequests.map((req) => (
          <li key={req.id} className="border p-4 mb-2 rounded bg-white">
            <Link href={`/requests/${req.id}`} className="text-blue-600">
              {req.title}
            </Link>
            <div className="text-sm text-gray-600">
              <p><strong>Business:</strong> {req.business}</p>
              <p><strong>Priority:</strong> {req.priority}</p>
              <p>
                <strong>Submitted by:</strong> {req.submitter_name} (
                {req.submitter_email})
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
