"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompany } from "@/lib/company";

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
  request_number?: number;
  company_id?: string;
};

const MAX_FILES = 6;
const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function NewRequestPage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [companySlug, setCompanySlug] = useState<string>("");
  const [companyLoading, setCompanyLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrder["priority"]>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const c = await getCompany(); // expects { id, slug, name }
        if (cancel) return;
        setCompanyId(c.id);
        setCompanySlug(c.slug);
      } catch (e: any) {
        console.error("getCompany failed:", e?.message || e);
        setError("Could not resolve company from subdomain.");
      } finally {
        if (!cancel) setCompanyLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

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
    const capped = chosen.slice(0, MAX_FILES);
    setFiles(capped);
    setPreviews(capped.map((f) => URL.createObjectURL(f)));
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

        const { error: rowErr } = await supabase.from("work_order_files").insert({
          work_order_id: workOrderId,
          note_id: null,
          path: key,
          url,
          company_id: companyId,
        });
        if (rowErr) throw new Error(rowErr.message);
        return url;
      })
    );

    const failed = uploads.filter((u) => u.status === "rejected");
    if (failed.length) console.warn("Some files failed to upload:", failed);
  }

  function computeHomeUrl(): string {
    const { protocol, hostname } = window.location;
    // If already on a company subdomain under facilitiesportal.com, go to "/"
    if (hostname.endsWith(".facilitiesportal.com") && !hostname.startsWith("www.")) {
      return `${protocol}//${hostname}/`;
    }
    // Otherwise (apex or vercel preview), use the resolved slug if available
    if (companySlug) {
      return `${protocol}//${companySlug}.facilitiesportal.com/`;
    }
    // Fallback: current origin root
    return `${protocol}//${hostname}/`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !description || !priority || !name || !email) {
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
    if (!companyId) {
      setError("Company context missing. Please reload the page and try again.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        priority,
        submitter_name: name,
        submitter_email: email,
        status: "open" as const,
        company_id: companyId, // DB trigger sets `business`
      };

      const { data, error } = await supabase.from("work_orders").insert(payload).select("*").single();
      if (error || !data) {
        console.error("Insert error:", error);
        setError(error?.message || "Failed to create request.");
        return;
      }

      try {
        await uploadAttachments(data.id);
      } catch (e: any) {
        console.warn("Attachment upload error:", e?.message || e);
      }

      try {
        await fetch("/api/notify-new-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ record: data as WorkOrder }),
        });
      } catch {
        // non-blocking
      }

      // ✅ Redirect to the company-specific home page
      const home = computeHomeUrl();
      window.location.replace(home);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Unexpected error while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  if (companyLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">New Request</h1>
        <div className="border rounded-xl p-5 shadow text-sm text-gray-600">
          Loading company context…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">New Request</h1>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-5 shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input className="w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="w-full border rounded p-2 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue/request" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select className="w-full border rounded p-2" value={priority} onChange={(e) => setPriority(e.target.value)} required>
            <option value="">Select priority</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input className="w-full border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your Email</label>
            <input type="email" className="w-full border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" required />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Attach Photos</label>
          <input type="file" accept="image/*" multiple onChange={onChooseFiles} className="block" />
          <p className="text-xs text-gray-500 mt-1">Up to {MAX_FILES} images. JPG/PNG/WEBP. Max {MAX_MB} MB each.</p>
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`preview ${i + 1}`} className="w-full h-24 object-cover rounded border" />
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
