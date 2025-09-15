"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  created_at: string;
  completion_note: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      let query = supabase.from("work_orders").select("*").eq("status", "completed");

      if (businessFilter) query = query.eq("business", businessFilter);
      if (priorityFilter) query = query.eq("priority", priorityFilter);

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) console.error("Error fetching completed requests:", error);
      else setRequests(data || []);
    }

    fetchRequests();
  }, [businessFilter, priorityFilter]);

  const deleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    const { error } = await supabase.from("work_orders").delete().eq("id", id);

    if (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request.");
    } else {
      setRequests(requests.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="mb-4 flex space-x-4">
        <a
          href="/requests"
          className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300"
        >
          Open Requests
        </a>
        <a
          href="/requests/completed"
          className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white"
        >
          Completed Requests
        </a>
      </div>

      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Businesses</option>
          <option value="Infuserve America">Infuserve America</option>
          <option value="Pharmetric">Pharmetric</option>
          <option value="Issak">Issak</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="non_critical">Non-Critical</option>
          <option value="routine">Routine</option>
        </select>
      </div>

      {/* Requests List */}
      <ul>
        {requests.map((req) => (
          <li
            key={req.id}
            className="border rounded p-4 mb-2 flex justify-between items-center"
          >
            <a href={`/requests/${req.id}`} className="font-bold text-blue-600 hover:underline">
              {req.title}
            </a>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{req.business} – {req.priority}</span>
              <button
                onClick={() => deleteRequest(req.id)}
                className="ml-2 px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
