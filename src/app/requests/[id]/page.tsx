"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Types
interface WorkOrder {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: "emergency" | "urgent" | "non_critical" | "routine" | string;
  submitter_name: string;
  submitter_email: string;
  status: "open" | "completed" | string;
  completion_note: string | null;
  created_at: string;
  completed_at: string | null;
}

interface WorkOrderNote {
  id: string;
  work_order_id: string;
  body: string;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Ongoing notes state
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteName, setNoteName] = useState("");
  const [noteEmail, setNoteEmail] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const canAddOngoingNote = useMemo(() => request?.status === "open", [request?.status]);

  // Fetch request
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();
      if (!isMounted) return;
      if (error) {
        setError(error.message);
      } else {
        setRequest(data as WorkOrder);
        setNote((data?.completion_note as string) || "");
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch ongoing notes
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("work_order_notes")
        .select("*")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (!error && data) setNotes(data as WorkOrderNote[]);
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function markCompleted() {
    if (!request) return;
    setSaving(true);
    const payload = {
      status: "completed" as const,
      completion_note: note || null,
      completed_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("work_orders")
      .update(payload)
      .eq("id", request.id)
      .select("*")
      .single();

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRequest(data as WorkOrder);
    router.refresh();
  }

  async function reopenRequest() {
    if (!request) return;
    setSaving(true);
    const payload = {
      status: "open" as const,
      completed_at: null,
      completion_note: null,
    };
    const { data, error } = await supabase
      .from("work_orders")
      .update(payload)
      .eq("id", request.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRequest(data as WorkOrder);
    setNote("");
    router.refresh();
  }

  async function addOngoingNote() {
    if (!id || !noteBody.trim()) return;
    setNoteSaving(true);
    const { data, error } = await supabase
      .from("work_order_notes")
      .insert({
        work_order_id: id,
        body: noteBody.trim(),
        author_name: noteName || null,
        author_email: noteEmail || null,
      })
      .select("*")
      .single();
    setNoteSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setNotes((prev) => [data as WorkOrderNote, ...prev]);
      setNoteBody("");
    }
  }

  function LabelValue({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <span className="text-sm">{children}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-40 w-full bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6">
        <div className="flex space-x-4 mb-6">
          <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">Open Requests</Link>
          <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">Completed Requests</Link>
        </div>
        <p className="text-red-600">{error || "Request not found."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4">
        <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">Open Requests</Link>
        <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">Completed Requests</Link>
      </div>

      {/* Header */}
      <div className="border rounded-xl shadow p-5 space-y-2">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold">{request.title}</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              request.status === "completed"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700"
            }`}
          >
            {request.status.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{request.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
          <LabelValue label="Business">{request.business}</LabelValue>
          <LabelValue label="Priority">{request.priority}</LabelValue>
          <LabelValue label="Submitted By">
            {request.submitter_name} ({request.submitter_email})
          </LabelValue>
          <LabelValue label="Submitted At">
            {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
          </LabelValue>
          <LabelValue label="Completed At">
            {request.completed_at ? new Date(request.completed_at).toLocaleString() : "—"}
          </LabelValue>
          <LabelValue label="Completion Notes">
            {request.completion_note ? (
              <span className="italic">{request.completion_note}</span>
            ) : (
              <span className="text-gray-500">—</span>
            )}
          </LabelValue>
        </div>
      </div>

      {/* Ongoing Notes */}
      <div className="border rounded-xl shadow p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ongoing Notes</h2>
          {!canAddOngoingNote && (
            <span className="text-xs text-gray-500">(Adding notes is disabled once completed)</span>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            className="w-full border rounded p-2 min-h-[90px]"
            placeholder="Add a progress update, diagnosis, parts on order, next steps, etc."
            disabled={!canAddOngoingNote}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              className="border rounded p-2"
              placeholder="Your name (optional)"
              disabled={!canAddOngoingNote}
            />
            <input
              type="email"
              value={noteEmail}
              onChange={(e) => setNoteEmail(e.target.value)}
              className="border rounded p-2"
              placeholder="Your email (optional)"
              disabled={!canAddOngoingNote}
            />
          </div>
          <button
            onClick={addOngoingNote}
            disabled={!canAddOngoingNote || noteSaving || !noteBody.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {noteSaving ? "Saving…" : "Add Note"}
          </button>
        </div>

        <div className="divide-y">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {n.author_name || "Anonymous"}
                    {n.author_email ? (
                      <span className="text-gray-500"> • {n.author_email}</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap mt-1">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border rounded-xl shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold">Update Status</h2>

        {request.status === "open" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Completion Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="What was done to complete this request?"
            />
            <button
              onClick={markCompleted}
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Mark as Completed"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={reopenRequest}
              disabled={saving}
              className="px-4 py-2 rounded bg-yellow-600 text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Reopen Request"}
            </button>
            <div>
              <label className="block text-sm font-medium">Edit Completion Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded p-2 min-h-[100px]"
              />
              <button
                onClick={async () => {
                  if (!request) return;
                  setSaving(true);
                  const { data, error } = await supabase
                    .from("work_orders")
                    .update({ completion_note: note })
                    .eq("id", request.id)
                    .select("*")
                    .single();
                  setSaving(false);
                  if (error) {
                    setError(error.message);
                  } else {
                    setRequest(data as WorkOrder);
                    router.refresh();
                  }
                }}
                disabled={saving}
                className="mt-2 px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Update Note"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="pt-2">
          <Link href="/requests" className="text-blue-700 underline">← Back to Requests</Link>
        </div>
      </div>
    </div>
  );
}
