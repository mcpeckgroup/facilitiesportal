"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  submitter_name: string;
  submitter_email: string;
  created_at: string;
  completed_at: string;
  completion_note: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) console.error("Error fetching completed requests:", error);
      else setRequests(data || []);
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    return (
      (businessFilter === "all" || req.business === businessFilter) &&
      (priorityFilter === "all" || req.priority === priorityFilter)
    );
  });

  async function handleDelete(id: string) {
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) {
      console.error("Error deleting request:", error);
    } else {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Completed Requests</h1>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/requests" style={{ marginRight: "15px" }}>
          Open Requests
        </Link>
        <Link href="/requests/completed" style={{ fontWeight: "bold" }}>
          Completed Requests
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Filter by Business:{" "}
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Infuserve America">Infuserve America</option>
            <option value="Pharmetric">Pharmetric</option>
            <option value="Issak">Issak</option>
          </select>
        </label>

        <label style={{ marginLeft: "20px" }}>
          Filter by Priority:{" "}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </label>
      </div>

      {/* Completed List */}
      <ul>
        {filteredRequests.map((req) => (
          <li key={req.id} style={{ marginBottom: "15px" }}>
            <Link href={`/requests/${req.id}`}>
              <strong>{req.title}</strong>
            </Link>
            <p>{req.description}</p>
            <p>
              <strong>Business:</strong> {req.business} |{" "}
              <strong>Priority:</strong> {req.priority}
            </p>
            <p>
              <strong>Submitted by:</strong> {req.submitter_name} ({req.submitter_email})
            </p>
            <p>
              <strong>Submitted:</strong>{" "}
              {req.created_at ? new Date(req.created_at).toLocaleString() : "—"}
            </p>
            <p>
              <strong>Completed:</strong>{" "}
              {req.completed_at ? new Date(req.completed_at).toLocaleString() : "—"}
            </p>
            {req.completion_note && (
              <p>
                <strong>Completion Note:</strong> {req.completion_note}
              </p>
            )}
            <button onClick={() => handleDelete(req.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
