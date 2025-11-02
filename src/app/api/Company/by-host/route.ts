// src/app/api/company/by-host/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // don't cache
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnon) {
      return new Response("Missing Supabase env vars", { status: 500 });
    }

    const search = req.nextUrl.searchParams;
    const explicitSlug = (search.get("slug") || "").toLowerCase().trim();

    // Prefer explicit ?slug=
    let slug = explicitSlug;

    // Fallback to subdomain (e.g., pharmetric.facilitiesportal.com)
    if (!slug) {
      const host = (req.headers.get("x-app-host") || req.headers.get("host") || "").toLowerCase();
      const parts = host.split(".").filter(Boolean);
      if (parts.length >= 3) {
        slug = parts[0] === "www" ? parts[1] : parts[0];
      }
    }

    // Optional default (remove if you want to strictly require a slug)
    if (!slug) {
      slug = "pharmetric";
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);

    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, name")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return new Response(`Company not found for slug "${slug}"`, { status: 404 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
