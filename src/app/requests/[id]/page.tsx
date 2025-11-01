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

type WorkOrderFile = {
  id: string;
  work_order_id: string | null;
  note_id: string | null;
  path: string;
  url: string;
  created_at: string;
};

const MAX_FILES = 6;
const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<WorkOrder | null>(null);
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [filesByNote, setFilesByNote] = useState<Record<string, WorkOrderFile[]>>({});
  const [loading, setLoading] = useState(true);

  // Add note form state
  const [noteBody, setNoteBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const [notePreviews, setNotePreviews] = useState<string[]>([]);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status actions
  const [completing, setCompleting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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
      }

      // Load all files for this request (both request-level and note-level)
      const { data: files } = await supabase
        .from("work_order_files")
        .select("*")
        .eq("work_order_id", id)
        .order("created_at", { ascending: false });

      if (!cancelled && files) {
        const map: Record<string, WorkOrderFile[]> = {};
        for (const f of files as WorkOrderFile[]) {
          if (!f.note_id) continue;
          if (!map[f.note_id]) map[f.note_id] = [];
          map[f.note_id].push(f);
        }
        setFilesByNote(map);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Realtime: new notes
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

  function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  function onChooseNoteFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    const capped = chosen.slice(0, MAX_FILES);
    setNoteFiles(capped);
    setNotePreviews(capped.map((f) => URL.createObjectURL(f)));
  }

  const filesError = useMemo(() => {
    if (noteFiles.length > MAX_FILES) return `Please select up to ${MAX_FILES} images.`;
    for (const f of noteFiles) {
      if (!ALLOWED.includes(f.type)) return "Only JPG, PNG, or WEBP images are allowed.";
      if (f.size > MAX_MB * 1024 * 1024) return `Each file must be ≤ ${MAX_MB} MB.`;
    }
    return null;
  }, [noteFiles]);

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
    if (filesError) {
      setFormError(filesError);
      return;
    }

    setSubmittingNote(true);

    // 1) Insert note
    const { data: noteRow, error: noteErr } = await supabase
      .from("work_order_notes")
      .insert({ work_order_id: id, body, author_name: name, author_email: email })
      .select("*")
      .single();

    if (noteErr || !noteRow) {
      setSubmittingNote(false);
      setFormError(noteErr?.message || "Failed to add note.");
      return;
    }

    // 2) Upload images for this note (optional)
    try {
      if (noteFiles.length) {
        const bucket = supabase.storage.from("work_order_uploads");
        const uploads = await Promise.allSettled(
          noteFiles.map(async (file) => {
            const key = `notes/${noteRow.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
            const { error: upErr } = await bucket.upload(key, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });
            if (upErr) throw new Error(upErr.message);

            const { data: pub } = bucket.getPublicUrl(key);
            const url = pub?.publicUrl || "";
            if (!url) throw new Error("Could not get public URL");

            const { error: rowErr } = await supabase
              .from("work_order_files")
              .insert({
                work_order_id: id,
                note_id: noteRow.id,
                path: key,
                url,
              });
            if (rowErr) throw new Error(rowErr.message);
            return { key, url };
          })
        );

        // Merge into UI map for this note
        const okFiles: WorkOrderFile[] = uploads
          .filter((u): u is PromiseFulfilledResult<{ key: string; url: string }> => u.status === "fulfilled")
          .map((u) => ({
            id: crypto.randomUUID(),
            work_order_id: id,
            note_id: noteRow.id,
            path: u.value.key,
            url: u.value.url,
            created_at: new Date().toISOString(),
          }));

        setFilesByNote((prev) => ({
          ...prev,
          [noteRow.id]: [...(prev[noteRow.id] || []), ...okFiles],
        }));

        const failures = uploads.filter((u) => u.status === "rejected");
        if (failures.length) {
          console.warn("Some images failed to upload:", failures);
        }
      }
    } catch (e: any) {
      console.warn("Attachment upload error:", e?.message || e);
    }

    // 3) Update local notes list
    setNotes((prev) => [noteRow as WorkOrderNote, ...prev]);
    setNoteBody("");
    setNoteFiles([]);
    setNotePreviews([]);
    setSubmittingNote(false);
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
      router.push("/requests/completed");
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
      router.push("/requests");
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

  const isCompleted = !isOpen;

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
            className={`px-4 py-2 rounded ${isCompleted ? "bg-blue-600 text-white" : "bg-gray-300"}`}
          >
            Completed Requests
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isOpen ? (
            <Link href="/requests" className="px-4 py-2 bg-gray-200 rounded border">← Back to Open</Link>
          ) : (
            <Link href="/requests/completed" className="px-4 py-2 bg-gray-200 rounded border">← Back to Completed</Link>
          )}

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

              {/* Images for the note */}
              <div>
                <label className="block text-sm font-medium mb-1">Attach Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onChooseNoteFiles}
                  className="block"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Up to {MAX_FILES} images. JPG/PNG/WEBP. Max {MAX_MB} MB each.
                </p>
                {notePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {notePreviews.map((src, i) => (
                      <img key={i} src={src} alt={`preview ${i + 1}`} className="w-full h-24 object-cover rounded border" />
                    ))}
                  </div>
                )}
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

        {/* Notes list with images */}
        <div className="border rounded-lg p-5 shadow">
          <h2 className="font-semibold mb-3">Ongoing Notes ({notes.length})</h2>
          <div className="space-y-3">
            {notes.map((n) => {
              const imgs = filesByNote[n.id] || [];
              return (
                <div key={n.id} className="border rounded p-3">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  {imgs.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imgs.map((f) => (
                        <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                          <img
                            src={f.url}
                            alt="attachment"
                            className="w-full h-24 object-cover rounded border"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    — {n.author_name} ({n.author_email}) • {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
            {notes.length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
