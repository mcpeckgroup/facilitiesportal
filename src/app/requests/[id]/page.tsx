"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Company = { id: string; slug: string; name: string };

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: "open" | "completed";
  submitter_name: string;
  submitter_email: string;
  created_at: string;
  completed_at?: string | null;
  completion_note?: string | null;
  request_number?: number | null;
  company_id: string;
};

type WorkOrderFile = {
  id: string;
  work_order_id: string;
  path: string;
  mime_type: string | null;
  created_at: string;
  publicUrl?: string; // derived
};

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workOrderId = params.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loadingWo, setLoadingWo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<WorkOrderFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Resolve company by subdomain
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/by-host", { cache: "no-store" });
        if (!res.ok) throw new Error("Company resolve failed");
        const data = (await res.json()) as Company;
        if (!cancelled) setCompany(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Company lookup failed");
      } finally {
        if (!cancelled) setLoadingCompany(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the work order (scoped to tenant)
  useEffect(() => {
    if (!company || !workOrderId) return;
    const companyId = company.id;

    let cancelled = false;

    async function loadWorkOrder() {
      setLoadingWo(true);
      const { data, error: err } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", workOrderId)
        .eq("company_id", companyId)
        .single();

      if (err) {
        if (!cancelled) {
          setError(err.message);
          setWo(null);
        }
      } else {
        if (!cancelled) setWo(data as WorkOrder);
      }
      if (!cancelled) setLoadingWo(false);
    }

    loadWorkOrder();

    // Realtime: refresh WO on updates
    const channel = supabase
      .channel(`wo-${workOrderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "work_orders", filter: `id=eq.${workOrderId}` },
        () => loadWorkOrder()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cancelled = true;
    };
  }, [company?.id, workOrderId]);

  // Load files + subscribe to file inserts for this work order
  useEffect(() => {
    if (!company || !workOrderId) return;

    let cancelled = false;

    async function loadFiles() {
      setLoadingFiles(true);
      const { data, error: err } = await supabase
        .from("work_order_files")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (err) {
        if (!cancelled) setError(err.message);
      } else {
        const withUrls: WorkOrderFile[] =
          (data || []).map((row: any) => {
            const { data: urlData } = supabase
              .storage
              .from("work-order-files")
              .getPublicUrl(row.path);
            return { ...row, publicUrl: urlData?.publicUrl || undefined };
          }) || [];
        if (!cancelled) setFiles(withUrls);
      }
      if (!cancelled) setLoadingFiles(false);
    }

    loadFiles();

    const channel = supabase
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
      supabase.removeChannel(channel);
      cancelled = true;
    };
  }, [company?.id, workOrderId]);

  const backLink = useMemo(() => {
    if (!wo) return "/requests";
    return wo.status === "completed" ? "/requests/completed" : "/requests";
  }, [wo]);

  async function handleComplete() {
    if (!wo) return;
    await supabase.from("work_orders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", wo.id);
  }

  async function handleReopen() {
    if (!wo) return;
    await supabase.from("work_orders").update({ status: "open", completed_at: null }).eq("id", wo.id);
  }

  if (loadingCompany || loadingWo) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href={backLink} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Back
          </a>
          <div className="flex-1" />
          <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Sign out
          </a>
        </div>
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href={backLink} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Back
          </a>
          <div className="flex-1" />
          <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Sign out
          </a>
        </div>
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3">{error}</div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <a href="/requests" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Back to Requests
          </a>
          <div className="flex-1" />
          <a href="/auth/sign-out" className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 transition">
            Sign out
          </a>
        </div>
        <p className="text-gray-600">Not found for this company.</p>
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
        {wo.title} {typeof wo.request_number === "number" ? <span className="text-gray-500">#{wo.request_number}</span> : null}
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
                <img
                  src={f.publicUrl}
                  alt={f.path}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="p-2 text-xs text-gray-600 truncate">{f.path.split("/").pop()}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* (Optional) Add your “Ongoing Notes” UI here if you had it before */}
      {/* Keep your existing notes form / list below this comment, unchanged */}
    </div>
  );
}
