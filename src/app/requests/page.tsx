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
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      let query = supabase.from("work_orders").select("*").eq("status", "open");

      if (businessFilter) query = query.eq("business", businessFilter);
      if (priorityFilter) query = query.eq("priority", priorityFilter);

      const { data, error } = await query;
      if (!error && data) setRequests(data);
    }
    fetchRequests();
  }, [businessFilter, priorityFilter]);

  const blockStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    background: "#fafafa",
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Open Requests</h1>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/requests" style={{ marginRight: "15px", fontWeight: "bold" }}>
          Open Requests
        </Link>
        <Link href="/requests/completed">Completed Requests</Link>
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
      {requests.length === 0 && <p>No open requests.</p>}
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
        </div>
      ))}
    </div>
  );
}
