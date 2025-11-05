"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; slug: string; name: string };

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  priority: "emergency" | "urgent" | "non_critical" | "routine";
  status: "open" | "completed";
  submitter_name: string;
  submitter_email: string;
  created_at: string;
  completed_at?: string | null;
  completion_note?: string | null;
  request_number?: number | null;
  company_id: string;
};

type Note = {
  id: string;
  work_order_id: string;
  company_id: string;
  author_name: string | null;
  author_email: string | null;
  body: string;
  created_at: string;
};

type WorkOrderFile = {
  id: string;
  work_order_id: string;
  path: string;
  mime_type: string | null;
  created_at: string;
  publicUrl?: string;
};

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const workOrderId = params.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [companyErr, setCompanyErr] = useState<string | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [woErr, setWoErr] = useState<string | null>(null);
  const [loadingWo, setLoadingWo] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [files, setFiles] = useState<WorkOrderFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Add Note form
  const [noteName, setNoteName] = useState("");
  const [noteEmail, setNoteEmail] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteFiles, setNoteFiles] = useState<FileList | null>(null);
  const [addingNote, setAddingNote] = useState(false);
  const [addNoteErr, setAddNoteErr] = useState<string | null>(null);

  // Resolve company from subdomain
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/by-host", { cache: "no-store" });
        if (!res.ok) throw new Error("Company resolve failed");
        const data = (await res.json()) as Company;
        if (!cancelled) setCompany(data);
      } catch (e: any) {
        if (!cancelled) setCompanyErr(e?.message || "Company lookup failed");
      } finally {
        if (!cancelled) setLoadingCompany(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the work order (tenant scoped)
  useEffect(() => {
    if (!company || !workOrderId) return;
    const companyId = company.id;
    let cancelled = false;

    async function loadWo() {
      setLoadingWo(true);
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", workOrderId)
        .eq("company_id", companyId)
        .single();

      if (error) {
        if (!cancelled) {
          setWoErr(error.message);
          setWo(null);
        }
      } else {
        if (!cancelled) setWo(data as WorkOrder);
      }
      if (!cancelled) setLoadingWo(false);
    }

    loadWo();

    const ch = supabase
      .channel(`wo-${workOrderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "work_orders", filter: `id=eq.${workOrderId}` },
        () => loadWo()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      cancelled = true;
    };
  }, [company?.id, workOrderId]);

  // Load notes + realtime
  useEffect(() => {
    if (!company || !workOrderId) return;
    let cancelled = false;

    async function loadNotes() {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from("work_order_notes")
        .select("id, work_order_id, company_id, author_name, author_email, body, created_at")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (!error && data && !cancelled) {
        setNotes(data as Note[]);
      }
      if (!cancelled) setLoadingNotes(false);
    }

    loadNotes();

    const ch = supabase
      .channel(`wo-notes-${workOrderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_order_notes", filter: `work_order_id=eq.${workOrderId}` },
        () => loadNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      cancelled = true;
    };
  }, [company?.id, workOrderId]);

  // Load photos + realtime
  useEffect(() => {
    if (!company || !workOrderId) return;
    let cancelled = false;

    async function loadFiles() {
      setLoadingFiles(true);
      const { data, error } = await supabase
        .from("work_order_files")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const withUrls: WorkOrderFile[] = (data as any[]).map((row) => {
          const { data: urlData } = supabase.storage.from("work-order-files").getPublicUrl(row.path);
          return { ...(row as WorkOrderFile), publicUrl: urlData?.publicUrl };
        });
        if (!cancelled) setFiles(withUrls);
      }
      if (!cancelled) setLoadingFiles(false);
    }

    loadFiles();

    const ch = supabase
      .channel(`wo-files-${workOrderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "work_order_files", filter: `work_order_id=eq.${workOrderId}` },
        () => loadFiles()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "work_order_files", filter: `work_order_id=eq.${workOrderId}` },
        () => loadFiles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      cancelled = true;
    };
  }, [company?.id, workOrderId]);

  const backLink = useMemo(() => {
    if (!wo) return "/requests";
    return wo.status === "completed" ? "/requests/completed" : "/requests";
  }, [wo]);

  async function handleComplete() {
    if (!wo) return;
    await supabase
      .from("work_orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", wo.id);
  }

  async function handleReopen() {
    if (!wo) return;
    await supabase.from("work_orders").update({ status: "open", completed_at: null }).eq("id", wo.id);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setAddNoteErr(null);

    if (!wo) return;
    if (!noteName.trim() || !noteEmail.trim() || !noteBody.trim()) {
      setAddNoteErr("Name, email, and note are required.");
      return;
    }

    setAddingNote(true);
    try {
      // 🔧 FIX: include company_id so NOT NULL constraint is satisfied
      const { error: noteErr } = await supabase.from("work_order_notes").insert([
        {
          work_order_id: wo.id,
          company_id: wo.company_id,            // <— critical line
          author_name: noteName.trim(),
          author_email: noteEmail.trim(),
          body: noteBody.trim(),
        },
      ]);
      if (noteErr) throw noteErr;

      // Optional: upload images attached to the note
      if (noteFiles && noteFiles.length) {
        const bucket = supabase.storage.from("work-order-files");
        for (const f of Array.from(noteFiles)) {
          const safe = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
          const path = `${company?.slug}/${wo.id}/${Date.now()}_${safe}`;
          const up = await bucket.upload(path, f, { cacheControl: "3600", upsert: false });
          if (!up.error) {
            await supabase.from("work_order_files").insert([
              { work_order_id: wo.id, path, mime_type: f.type || null },
            ]);
          } else {
            console.warn("Upload failed:", up.error.message);
          }
        }
      }

      setNoteBody("");
      setNoteFiles(null);
    } catch (err: any) {
      setAddNoteErr(err?.message || "Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  }

  if (loadingCompany || loadingWo) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href={backLink} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">Back</a>
          <div className="flex-1" />
          <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">Sign out</a>
        </div>
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (companyErr || woErr || !wo) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href="/requests" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">Back to Requests</a>
          <div className="flex-1" />
          <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">Sign out</a>
        </div>
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3">
          {companyErr || woErr || "Not found for this company."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header / actions */}
      <div className="mb-6 flex items-center gap-3">
        <a href={backLink} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
          {wo.status === "completed" ? "Back to Completed" : "Back to Open"}
        </a>
        <div className="flex-1" />
        {wo.status === "open" ? (
          <button onClick={handleComplete} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition">
            Mark Completed
          </button>
        ) : (
          <button onClick={handleReopen} className="px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition">
            Reopen
          </button>
        )}
        <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
          Sign out
        </a>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold mb-2">
        {wo.title}{" "}
        {typeof wo.request_number === "number" ? (
          <span className="text-gray-500">#{wo.request_number}</span>
        ) : null}
      </h1>

      {/* Meta */}
      <p className="text-sm text-gray-600 mb-4">
        Priority: <strong>{wo.priority}</strong> &nbsp;|&nbsp; Submitted by: {wo.submitter_name} ({wo.submitter_email}) &nbsp;|&nbsp; Submitted at:{" "}
        {new Date(wo.created_at).toLocaleString()}
        {wo.completed_at ? <> &nbsp;|&nbsp; Completed at: {new Date(wo.completed_at).toLocaleString()}</> : null}
      </p>

      {/* Description */}
      <div className="border rounded-lg p-4 bg-white shadow mb-6">
        <h2 className="font-semibold mb-2">Description</h2>
        <p className="whitespace-pre-wrap">{wo.description}</p>
        {wo.completion_note ? (
          <p className="mt-3 text-sm italic text-gray-700">
            <span className="font-semibold not-italic text-gray-800">Completion Notes:</span> {wo.completion_note}
          </p>
        ) : null}
      </div>

      {/* Photos */}
      <div className="border rounded-lg p-4 bg-white shadow mb-6">
        <h2 className="font-semibold mb-3">Photos</h2>
        {loadingFiles ? (
          <p className="text-gray-600">Loading photos…</p>
        ) : files.length === 0 ? (
          <p className="text-gray-600">No photos attached.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((f) => (
              <a
                key={f.id}
                href={f.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block border rounded overflow-hidden bg-gray-50 hover:shadow"
                title={f.path}
              >
                <img src={f.publicUrl} alt={f.path} className="w-full h-40 object-cover" loading="lazy" />
                <div className="p-2 text-xs text-gray-600 truncate">{f.path.split("/").pop()}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Ongoing Notes */}
      <div className="border rounded-lg p-4 bg-white shadow">
        <h2 className="font-semibold mb-3">Ongoing Notes</h2>

        {loadingNotes ? (
          <p className="text-gray-600 mb-3">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-600 mb-3">No notes yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {notes.map((n) => (
              <div key={n.id} className="border rounded p-3 bg-gray-50">
                <div className="text-sm text-gray-600 mb-1">
                  {n.author_name || "Unknown"} ({n.author_email || "no email"}) — {new Date(n.created_at).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap">{n.body}</div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddNote} className="grid gap-3">
          {addNoteErr && (
            <div className="rounded border border-red-300 bg-red-50 text-red-700 p-2">{addNoteErr}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name *</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Email *</label>
              <input
                type="email"
                className="w-full border rounded p-2"
                value={noteEmail}
                onChange={(e) => setNoteEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note *</label>
            <textarea
              className="w-full border rounded p-2 h-28"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attach Photos (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNoteFiles(e.target.files)}
              className="w-full border rounded p-2 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">You can select multiple images.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={addingNote}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {addingNote ? "Adding…" : "Add Note"}
            </button>
            <a href={backLink} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
              Back
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
