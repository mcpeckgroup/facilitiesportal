"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  completion_note: string;
  priority: string;
  business: string;
};

export default function CompletedRequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching completed requests:", error);
      } else {
        setRequests(data || []);
      }
    }
    fetchRequests();
  }, []);

  async function deleteRequest(id: string) {
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) {
      console.error("Error deleting:", error);
    } else {
      setRequests(requests.filter((req) => req.id !== id));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Completed Requests</h1>

      <div className="mb-4 space-x-4">
        <Link href="/requests" className="px-3 py-2 bg-blue-500 text-white rounded">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-3 py-2 bg-gray-500 text-white rounded">
          Completed Requests
        </Link>
      </div>

      <ul className="space-y-3">
        {requests.map((req) => (
          <li key={req.id} className="border rounded p-3">
            <Link href={`/requests/${req.id}`} className="font-semibold text-blue-600">
              {req.title}
            </Link>
            <p>{req.description}</p>
            <p className="text-sm text-gray-600">Note: {req.completion_note}</p>
            <button
              onClick={() => deleteRequest(req.id)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
