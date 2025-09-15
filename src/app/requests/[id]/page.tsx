"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: string;
  completion_note: string;
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    async function fetchRequest() {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching request:", error);
      } else {
        setRequest(data);
      }
    }
    fetchRequest();
  }, [id]);

  async function markCompleted() {
    if (!id) return;
    const { error } = await supabase
      .from("work_orders")
      .update({ status: "completed", completion_note: completionNote })
      .eq("id", id);

    if (error) {
      console.error("Error marking complete:", error);
    } else {
      router.push("/requests/completed");
    }
  }

  if (!request) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{request.title}</h1>
      <p>{request.description}</p>

      {request.status === "open" && (
        <div className="mt-4">
          <textarea
            placeholder="Completion notes"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <button
            onClick={markCompleted}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Mark as Completed
          </button>
        </div>
      )}

      {request.status === "completed" && (
        <p className="mt-4 text-gray-700">Completion Note: {request.completion_note}</p>
      )}
    </div>
  );
}
