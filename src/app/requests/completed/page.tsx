"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
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
  const [businessFilter, setBusinessFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      let query = supabase.from("work_orders").select("*").eq("status", "completed");

      if (businessFilter) query = query.eq("business", businessFilter);
      if (priorityFilter) query = query.eq("priority", priorityFilter);

      const { data, error } = await query;
      if (!error && data) setRequests(data);
    }
    fetchRequests();
  }, [businessFilter, priorityFilter]);

  async function deleteRequest(id: string) {
    if (!confirm("Are you sure you want to delete this request?")) return;

    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) console.error("Error deleting request:", error);
    else setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  const blockStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    background: "#fafafa",
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Completed Requests</h1>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/requests" style={{ marginRight: "15px" }}>
          Open Requests
        </Link>
        <Link href="/requests" style={{ fontWeight: "bold" }}>
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
            <option value="">All</option>
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
            <option value="">All</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </label>
      </div>

      {/* Requests List */}
      {requests.length === 0 && <p>No completed requests.</p>}
      {requests.map((req) => (
        <div key={req.id} style={blockStyle}>
          <h3>
            <Link href={`/requests/${req.id}`}>{req.title}</Link>
          </h3>
          <p><strong>Business:</strong> {req.business}</p>
          <p><strong>Priority:</strong> {req.priority}</p>
          <p>
            <strong>Submitted by:</strong> {req.submitter_name} (
            {req.submitter_email})
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(req.created_at).toLocaleString()}
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
          <button
            onClick={() => deleteRequest(req.id)}
            style={{ marginTop: "10px", color: "red" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
