"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<WorkOrder[]>([]);
  const [filterBusiness, setFilterBusiness] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (!error && data) setRequests(data);
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    return (
      (filterBusiness ? req.business === filterBusiness : true) &&
      (filterPriority ? req.priority === filterPriority : true)
    );
  });

  return (
    <div className="p-6">
      <div className="flex space-x-4 mb-6">
        <Link href="/requests" className="px-4 py-2 bg-blue-600 text-white rounded">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">
          Completed Requests
        </Link>
      </div>

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

      <div className="grid gap-4">
        {filteredRequests.map((req) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
