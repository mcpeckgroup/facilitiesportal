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
  const [completionNote, setCompletionNote] = useState("");
  const [showCompletionForm, setShowCompletionForm] = useState(false);

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
    if (!completionNote.trim()) {
      alert("Please enter a completion note before completing.");
      return;
    }

    const { error } = await supabase
      .from("work_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completion_note: completionNote,
      })
      .eq("id", request.id);

    if (error) console.error("Error marking complete:", error);
    else router.push("/requests/completed");
  }

  if (!request) return <p>Loading...</p>;

  const blockStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    background: "#fafafa",
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Work Order Details</h1>

      <div style={blockStyle}>
        <strong>Title:</strong>
        <p>{request.title}</p>
      </div>

      <div style={blockStyle}>
        <strong>Description:</strong>
        <p>{request.description}</p>
      </div>

      <div style={blockStyle}>
        <strong>Business:</strong> {request.business}
      </div>

      <div style={blockStyle}>
        <strong>Priority:</strong> {request.priority}
      </div>

      <div style={blockStyle}>
        <strong>Status:</strong> {request.status}
      </div>

      <div style={blockStyle}>
        <strong>Submitted by:</strong> {request.submitter_name} (
        {request.submitter_email})
      </div>

      <div style={blockStyle}>
        <strong>Submitted:</strong>{" "}
        {request.created_at
          ? new Date(request.created_at).toLocaleString()
          : "—"}
      </div>

      {request.status === "completed" && (
        <>
          <div style={blockStyle}>
            <strong>Completed:</strong>{" "}
            {request.completed_at
              ? new Date(request.completed_at).toLocaleString()
              : "—"}
          </div>
          {request.completion_note && (
            <div style={blockStyle}>
              <strong>Completion Note:</strong>
              <p>{request.completion_note}</p>
            </div>
          )}
        </>
      )}

      {request.status !== "completed" && (
        <div style={blockStyle}>
          {!showCompletionForm ? (
            <button onClick={() => setShowCompletionForm(true)}>
              Mark as Completed
            </button>
          ) : (
            <>
              <label>
                <strong>Completion Note:</strong>
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                rows={4}
                style={{ width: "100%", marginTop: "10px" }}
              />
              <button
                onClick={markComplete}
                style={{ marginTop: "10px", display: "block" }}
              >
                Submit Completion
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
