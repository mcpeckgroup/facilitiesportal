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
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching requests:", error);
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

  return (
    <div style={{ padding: "20px" }}>
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

      {/* Request List */}
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
              {req.created_at
                ? new Date(req.created_at).toLocaleString()
                : "—"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
