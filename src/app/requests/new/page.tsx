"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; slug: string; name: string };

export default function NewRequestPage() {
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // business removed per your new multi-tenant model
  const [priority, setPriority] = useState<"emergency" | "urgent" | "non_critical" | "routine">("routine");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve company from host
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/company/by-host", { cache: "no-store" });
        if (!r.ok) throw new Error("Could not resolve company from subdomain.");
        const data = (await r.json()) as Company;
        if (!cancelled) setCompany(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Company lookup failed");
      } finally {
        if (!cancelled) setLoadingCompany(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!company) {
      setErr("Company not resolved.");
      return;
    }
    if (!title.trim() || !description.trim() || !name.trim() || !email.trim()) {
      setErr("Please fill in Title, Description, Name and Email.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Create the work order (with company_id)
      const { data: inserted, error: insErr } = await supabase
        .from("work_orders")
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            priority,
            status: "open",
            submitter_name: name.trim(),
            submitter_email: email.trim(),
            company_id: company.id,
          },
        ])
        .select("*")
        .single();

      if (insErr || !inserted) {
        throw new Error(insErr?.message || "Failed to create request");
      }

      // 2) If user attached photos, send them using our server route (service key)
      if (photoFiles && photoFiles.length) {
        const fd = new FormData();
        fd.append("work_order_id", inserted.id);
        fd.append("company_slug", company.slug);
        Array.from(photoFiles).forEach((f) => fd.append("files", f));
        const resp = await fetch("/api/upload-work-order-file", {
          method: "POST",
          body: fd,
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          console.warn("Upload route failed:", resp.status, txt);
          // don't block the UX on upload fail, but you can surface a toast here if you want
        }
      }

      // 3) Redirect to the tenant home (your current behavior)
      router.push("/");

    } catch (e: any) {
      setErr(e?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCompany) {
    return <div className="p-6">Loading…</div>;
  }
  if (err) {
    return <div className="p-6 text-red-600">{err}</div>;
  }
  if (!company) {
    return <div className="p-6 text-red-600">Could not resolve company.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">New Request</h1>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded p-2 h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Priority (kept) */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            className="w-full border rounded p-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        {/* Submitter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              className="w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              required
            />
          </div>
        </div>

        {/* Photos (optional) */}
        <div>
          <label className="block text-sm font-medium mb-1">Attach Photos (optional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(e.target.files)}
            className="w-full border rounded p-2 bg-white"
          />
          <p className="text-xs text-gray-500 mt-1">You can select multiple images.</p>
        </div>

        {err && <div className="rounded border border-red-300 bg-red-50 text-red-700 p-2">{err}</div>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
          <a href="/" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">Cancel</a>
        </div>
      </form>
    </div>
  );
}
