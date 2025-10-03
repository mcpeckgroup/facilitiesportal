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
  submitter_name: string;
  submitter_email: string;
  created_at: string;
  completed_at: string;
  completion_note: string;
};

type WorkOrderNote = {
  id: string;
  work_order_id: string;
  body: string;
  created_at: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed") // ✅ lowercase filter
        .order("completed_at", { ascending: false });
      if (!error && data) setRequests(data);
    }
    fetchRequests();

    async function fetchNotes() {
      const { data, error } = await supabase
        .from("work_order_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setNotes(data);
    }
    fetchNotes();
  }, []);

  const filteredRequests = requests.filter((req) => {
    return (
      (filterBusiness ? req.business === filterBusiness : true) &&
      (filterPriority ? req.priority === filterPriority : true)
    );
  });

  function getNotesForRequest(requestId: string) {
    return notes.filter((n) => n.work_order_id === requestId);
  }

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

      {/* Request list */}
      <div className="grid gap-4">
        {filteredRequests.map((req) => {
          const reqNotes = getNotesForRequest(req.id);
          const latestNote = reqNotes[0]?.body ?? null;

          return (
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
                Completed at: {new Date(req.completed_at).toLocaleString()}
              </p>
              <p className="text-sm italic">Completion Notes: {req.completion_note}</p>
              {latestNote && (
                <p className="text-sm text-blue-700 mt-2 italic">
                  Latest note: {latestNote.length > 80 ? latestNote.slice(0, 80) + "…" : latestNote}
                </p>
              )}
              <p className="text-xs text-gray-500">Notes: {reqNotes.length}</p>
              <button
                onClick={() => handleDelete(req.id)}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
