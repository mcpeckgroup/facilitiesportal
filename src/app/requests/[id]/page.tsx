"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description?: string;
  business?: string;
  priority?: string;
  status: string;
  completion_note?: string;
  submitter_name?: string;
  submitter_email?: string;
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    async function fetchRequest() {
      const { data } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setRequest(data);
        setCompletionNote(data.completion_note || "");
      }
    }
    if (id) fetchRequest();
  }, [id]);

  const markCompleted = async () => {
    if (!id) return;
    await supabase
      .from("work_orders")
      .update({ status: "completed", completion_note: completionNote })
      .eq("id", id);
    router.push("/requests/completed");
  };

  if (!request) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{request.title}</h1>

      {request.description && (
        <p className="mb-2 text-gray-700">{request.description}</p>
      )}

      <p><strong>Business:</strong> {request.business}</p>
      <p><strong>Priority:</strong> {request.priority}</p>
      <p><strong>Status:</strong> {request.status}</p>

      {/* Show submitter info */}
      <p>
        <strong>Submitted by:</strong> {request.submitter_name} (
        {request.submitter_email})
      </p>

      {request.status !== "completed" && (
        <div className="mt-4">
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder="Add completion notes..."
            className="w-full border p-2 rounded"
          />
          <button
            onClick={markCompleted}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {request.status === "completed" && request.completion_note && (
        <p className="mt-4 text-gray-700">
          <strong>Completion Notes:</strong> {request.completion_note}
        </p>
      )}
    </div>
  );
}
