"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function NewRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [business, setBusiness] = useState("");
  const [priority, setPriority] = useState<WorkOrder["priority"]>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
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

    setSubmitting(true);

    // 1) Create the work order (status must be lowercase "open")
    const payload = {
      title,
      description,
      business,
      priority,
      submitter_name: name,
      submitter_email: email,
      status: "open" as const,
    };

    const { data, error } = await supabase
      .from("work_orders")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      setSubmitting(false);
      setError(error?.message || "Failed to create request.");
      return;
    }

    // 2) Fire-and-forget email notification (do not block redirect)
    try {
      await fetch("/api/notify-new-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: data }),
      });
    } catch {
      // ignore notify errors to keep UX smooth
    }

    // 3) Redirect to the login page (absolute URL)
    // Use replace so the user can't go "Back" to resubmit the same form.
    window.location.replace("https://www.facilitiesportal.com/");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Tabs / Nav */}
      <div className="flex space-x-4">
        <Link href="/requests" className="px-4 py-2 bg-gray-300 rounded">
          Open Requests
        </Link>
        <Link href="/requests/completed" className="px-4 py-2 bg-gray-300 rounded">
          Completed Requests
        </Link>
      </div>

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
