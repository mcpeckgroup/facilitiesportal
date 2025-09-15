"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  completed_at: string;
  completion_note: string;
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<WorkOrder | null>(null);

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
      }
    }
    fetchRequest();
  }, [params?.id]);

  async function markComplete() {
    if (!request) return;
    const { error } = await supabase
      .from("work_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) console.error("Error marking complete:", error);
    else router.push("/requests/completed");
  }

  if (!request) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{request.title}</h1>
      <p>{request.description}</p>

      <p>
        <strong>Business:</strong> {request.business}
      </p>
      <p>
        <strong>Priority:</strong> {request.priority}
      </p>
      <p>
        <strong>Status:</strong> {request.status}
      </p>
      <p>
        <strong>Submitted by:</strong> {request.submitter_name} (
        {request.submitter_email})
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {request.created_at
          ? new Date(request.created_at).toLocaleString()
          : "—"}
      </p>
      {request.status === "completed" && (
        <>
          <p>
            <strong>Completed:</strong>{" "}
            {request.completed_at
              ? new Date(request.completed_at).toLocaleString()
              : "—"}
          </p>
          {request.completion_note && (
            <p>
              <strong>Completion Note:</strong> {request.completion_note}
            </p>
          )}
        </>
      )}

      {request.status !== "completed" && (
        <button onClick={markComplete} style={{ marginTop: "15px" }}>
          Mark as Completed
        </button>
      )}
    </div>
  );
}
