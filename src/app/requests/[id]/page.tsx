"use client";

import { useEffect, useMemo, useState } from "react";
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
  status: "open" | "completed" | string;
  created_at: string;
  completed_at: string | null;
  completion_note: string | null;
};

type WorkOrderNote = {
  id: string;
  work_order_id: string;
  body: string;
  author_name: string;
  author_email: string;
  created_at: string;
};

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Ongoing note form (all required)
  const [noteBody, setNoteBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Complete / Reopen state
  const [completing, setCompleting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Fetch request + notes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: req, error: reqErr }, { data: nts, error: ntsErr }] = await Promise.all([
        supabase.from("work_orders").select("*").eq("id", id).single(),
        supabase
          .from("work_order_notes")
          .select("*")
          .eq("work_order_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (!cancelled) {
        if (!reqErr) setRequest(req as WorkOrder);
        if (!ntsErr && nts) setNotes(nts as WorkOrderNote[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Realtime: receive new notes for this work order
  useEffect(() => {
    const channel = supabase
      .channel(`notes-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_order_notes", filter: `work_order_id=eq.${id}` },
        (payload) => {
          const row = payload.new as unknown as WorkOrderNote;
          setNotes((prev) => [row, ...prev].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const isOpen = useMemo(() => request?.status === "open", [request]);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const body = noteBody.trim();
    const name = authorName.trim();
    const email = authorEmail.trim();

    if (!body || !name || !email) {
      setFormError("Note, Name, and Email are all required.");
      return;
    }
    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSubmittingNote(true);
    const { data, error } = await supabase
      .from("work_order_notes")
      .insert({ work_order_id: id, body, author_name: name, author_email: email })
      .select("*")
      .single();
    setSubmittingNote(false);

    if (error) {
      setFormError(error.message || "Failed to add note.");
      return;
    }

    if (data) {
      setNotes((prev) => [data as WorkOrderNote, ...prev].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
      setNoteBody("");
      // keep name/email for convenience
    }
  }

  async function handleMarkCompleted() {
    if (!request || !isOpen) return;
    setStatusError(null);
    setCompleting(true);

    const { data, error } = await supabase
      .from("work_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        // keep existing completion_note unchanged (null unless you set it elsewhere)
      })
      .eq("id", request.id)
      .select("*")
      .single();

    setCompleting(false);

    if (error) {
      setStatusError(error.message || "Failed to mark as completed.");
      return;
    }

    if (data) {
      setRequest(data as WorkOrder);
      router.push("/requests/completed"); // go to completed list
    }
  }

  async function handleReopen() {
    if (!request || isOpen) return;
    setStatusError(null);
    setReopening(true);

    const { data, error } = await supabase
      .from("work_orders")
      .update({
        status: "open",
        completed_at: null,
        // preserve completion_note to keep history; it will hide when not completed
      })
      .eq("id", request.id)
      .select("*")
      .single();

    setReopening(false);

    if (error) {
      setStatusError(error.message || "Failed to reopen request.");
      return;
    }

    if (data) {
      setRequest(data as WorkOrder);
      router.push("/requests"); // go to open list
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading…</div>;

  if (!request) {
    return (
      <div className="p-6">
        <div className="mb-6 flex space-x-4">
          <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">
            Open Requests
          </Link>
          <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">
            Completed Requests
          </Link>
        </div>
        <p className="text-sm text-red-600">Request not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tabs + Back + Action */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <Link
            href="/requests"
            className={`px-4 py-2 rounded ${isOpen ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          >
            Open Requests
          </Link>
          <Link
            href="/requests/completed"
            className={`px-4 py-2 rounded ${!isOpen ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          >
            Completed Requests
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to the correct list */}
          {isOpen ? (
            <Link href="/requests" className="px-4 py-2 bg-gray-200 rounded border">← Back to Open</Link>
          ) : (
            <Link href="/requests/completed" className="px-4 py-2 bg-gray-200 rounded border">← Back to Completed</Link>
          )}

          {/* Action button */}
          {isOpen ? (
            <button
              onClick={handleMarkCompleted}
              disabled={completing}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
            >
              {completing ? "Completing…" : "Mark as Completed"}
            </button>
          ) : (
            <button
              onClick={handleReopen}
              disabled={reopening}
              className="px-4 py-2 bg-yellow-600 text-white rounded disabled:opacity-60"
            >
              {reopening ? "Reopening…" : "Reopen Request"}
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="border rounded-lg p-5 shadow">
        <h1 className="text-xl font-semibold mb-1">{request.title}</h1>
        <p className="mb-2">{request.description}</p>
        <p className="text-sm text-gray-600">Business: {request.business} | Priority: {request.priority}</p>
        <p className="text-sm text-gray-600">
          Submitted by: {request.submitter_name} ({request.submitter_email})
        </p>
        <p className="text-sm text-gray-600">Submitted at: {new Date(request.created_at).toLocaleString()}</p>
        {request.completed_at && (
          <>
            <p className="text-sm text-gray-600">Completed at: {new Date(request.completed_at).toLocaleString()}</p>
            <p className="text-sm italic">Completion Notes: {request.completion_note || "—"}</p>
          </>
        )}
        {statusError && <p className="text-sm text-red-600 mt-2">{statusError}</p>}
      </div>

      {/* Notes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Add note (only when open) */}
        <div className="border rounded-lg p-5 shadow">
          <h2 className="font-semibold mb-3">Add Ongoing Note</h2>

          {isOpen ? (
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Note <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="w-full border rounded p-2 min-h-[100px]"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full border rounded p-2"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded p-2"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={submittingNote}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
              >
                {submittingNote ? "Adding…" : "Add Note"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-600">This request is completed. Adding new notes is disabled.</p>
          )}
        </div>

        {/* Notes list */}
        <div className="border rounded-lg p-5 shadow">
          <h2 className="font-semibold mb-3">Ongoing Notes ({notes.length})</h2>
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="border rounded p-3">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="text-xs text-gray-600 mt-2">
                  — {n.author_name} ({n.author_email}) • {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
