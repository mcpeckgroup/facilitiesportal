"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  business: string;
  submitter_name: string;
  submitter_email: string;
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data || []);
      }
    }
    fetchRequests();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Open Requests</h1>

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
            <p className="text-sm text-gray-600">Priority: {req.priority}</p>
            <p className="text-sm text-gray-600">Business: {req.business}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
