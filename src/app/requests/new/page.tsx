"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  business: string;
  priority: "emergency" | "urgent" | "non_critical" | "routine" | string;
  submitter_name: string;
  submitter_email: string;
  status: "open" | "completed" | string;
  created_at: string;
  completed_at: string | null;
  completion_note: string | null;
};

const MAX_FILES = 6;
const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function NewRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [business, setBusiness] = useState("");
  const [priority, setPriority] = useState<WorkOrder["priority"]>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  }

  const filesError = useMemo(() => {
    if (files.length > MAX_FILES) return `Please select up to ${MAX_FILES} images.`;
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) return "Only JPG, PNG, or WEBP images are allowed.";
      if (f.size > MAX_MB * 1024 * 1024) return `Each file must be ≤ ${MAX_MB} MB.`;
    }
    return null;
  }, [files]);

  function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    setFiles(chosen.slice(0, MAX_FILES));
    setPreviews(chosen.slice(0, MAX_FILES).map((f) => URL.createObjectURL(f)));
  }

  function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  async function uploadAttachments(workOrderId: string) {
    if (!files.length) return;

    const bucket = supabase.storage.from("work_order_uploads");

    const uploads = await Promise.allSettled(
      files.map(async (file) => {
        const key = `requests/${workOrderId}/${Date.now()}-${sanitizeFilename(file.name)}`;
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
            work_order_id: workOrderId,
            note_id: null,
            path: key,
            url,
          });
        if (rowErr) throw new Error(rowErr.message);
        return url;
      })
    );

    const failed = uploads.filter((u) => u.status === "rejected");
    if (failed.length) {
      console.warn("Some files failed to upload:", failed);
      // We won’t block the request creation if a couple images fail.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !description || !business || !priority || !name || !email) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (filesError) {
      setError(filesError);
      return;
    }

    setSubmitting(true);

    // 1) Create the work order
    const payload = {
      title,
      description,
      business,
      priority,
      submitter_name: name,
      submitter_email: email,
      status: "open" as const,
    };

    const { data, error } = await supabase.from("work_orders").insert(payload).select("*").single();

    if (error || !data) {
      setSubmitting(false);
      setError(error?.message || "Failed to create request.");
      return;
    }

    // 2) Upload images (non-blocking if some fail)
    try {
      await uploadAttachments(data.id);
    } catch (e: any) {
      console.warn("Attachment upload error:", e?.message || e);
    }

    // 3) Fire-and-forget email notification
    try {
      await fetch("/api/notify-new-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: data }),
      });
    } catch {}

    // 4) Redirect to login
    window.location.replace("https://www.facilitiesportal.com/");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">New Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-5 shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded p-2 min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue/request"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Business</label>
            <select
              className="w-full border rounded p-2"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              required
            >
              <option value="">Select business</option>
              <option value="Infuserve America">Infuserve America</option>
              <option value="Pharmetric">Pharmetric</option>
              <option value="Issak">Issak</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full border rounded p-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            >
              <option value="">Select priority</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="non_critical">Non-Critical</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              className="w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Email</label>
            <input
              type="email"
              className="w-full border rounded p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Attach Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onChooseFiles}
            className="block"
          />
          <p className="text-xs text-gray-500 mt-1">
            Up to {MAX_FILES} images. JPG/PNG/WEBP. Max {MAX_MB} MB each.
          </p>
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`preview ${i + 1}`} className="w-full h-24 object-cover rounded border" />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
