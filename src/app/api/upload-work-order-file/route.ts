// src/app/api/upload-work-order-file/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY keys
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // add in Vercel

// NOTE: this route expects multipart/form-data:
// - work_order_id: string (uuid)
// - company_slug: string (e.g., "infuserve")
// - files: File | File[] (one or many)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response("Server not configured", { status: 500 });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const form = await req.formData();

    const work_order_id = String(form.get("work_order_id") || "").trim();
    const company_slug = String(form.get("company_slug") || "").trim();

    if (!work_order_id || !company_slug) {
      return new Response("Missing work_order_id or company_slug", { status: 400 });
    }

    // Collect all files[] entries
    const fileEntries = form.getAll("files") as File[];
    if (!fileEntries.length) {
      return new Response(JSON.stringify({ uploaded: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: Array<{ path: string; mime: string | null }> = [];

    for (const f of fileEntries) {
      const arrayBuf = await f.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const mime = f.type || null;
      const name = safeName(f.name || "upload.bin");
      const path = `${company_slug}/${work_order_id}/${Date.now()}_${name}`;

      // Upload to public bucket
      const up = await admin.storage
        .from("work-order-files")
        .upload(path, buf, { contentType: mime ?? undefined, upsert: false });

      if (up.error) {
        console.error("upload error", up.error);
        return new Response(`Upload failed: ${up.error.message}`, { status: 500 });
      }

      // Insert DB row
      const ins = await admin.from("work_order_files").insert([
        {
          work_order_id,
          path,
          mime_type: mime,
        },
      ]);

      if (ins.error) {
        console.error("insert error", ins.error);
        return new Response(`DB insert failed: ${ins.error.message}`, { status: 500 });
      }

      results.push({ path, mime });
    }

    return new Response(JSON.stringify({ uploaded: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(e?.message || "Upload failed", { status: 500 });
  }
}
