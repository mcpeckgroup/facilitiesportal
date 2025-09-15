"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  status: string;
  created_at: string;
  completion_note?: string;
  submitter_name?: string;
  submitter_email?: string;
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    async function fetchRequest() {
      if (!params?.id) return;

      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching request:", error);
      } else {
        setRequest(data);
        setCompletionNote(data.completion_note || "");
      }
      setLoading(false);
    }

    fetchRequest();
  }, [params?.id]);

  const markCompleted = async () => {
    if (!request) return;

    const { error } = await supabase
      .from("work_orders")
      .update({
        status: "completed",
        completion_note: completionNote,
      })
      .eq("id", request.id);

    if (error) {
      console.error("Error marking completed:", error);
      alert("Failed to update request.");
    } else {
      router.push("/requests/completed");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!request) return <p className="p-6">Request not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{request.title}</h1>
      <p className="mb-2"><strong>Description:</strong> {request.description}</p>
      <p className="mb-2"><strong>Business:</strong> {request.business}</p>
      <p className="mb-2"><strong>Priority:</strong> {request.priority}</p>
      <p className="mb-2"><strong>Status:</strong> {request.status}</p>
      <p className="mb-2"><strong>Submitted by:</strong> {request.submitter_name} ({request.submitter_email})</p>
      <p className="mb-2 text-gray-500"><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</p>

      {request.status === "completed" ? (
        <div className="mt-4">
          <p><strong>Completion Note:</strong></p>
          <p className="border p-2 rounded bg-gray-100 mt-1">
            {request.completion_note || "No notes provided."}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <label className="block mb-2 font-semibold">Completion Note</label>
          <textarea
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="border rounded w-full p-2 mb-4"
            rows={4}
          />
          <button
            onClick={markCompleted}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
}
