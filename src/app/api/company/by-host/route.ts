// src/app/api/company/by-host/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const parts = host.toLowerCase().split(".").filter(Boolean);
  // e.g. pharmetriclab.facilitiesportal.com
  if (parts.length >= 3) return parts[0] === "www" ? parts[1] : parts[0];
  return null;
}

export async function GET(req: NextRequest) {
  if (!supabaseUrl || !supabaseAnon) {
    return new Response("Missing Supabase env vars", { status: 500 });
  }
  const sb = createClient(supabaseUrl, supabaseAnon);
  const urlSlug = (req.nextUrl.searchParams.get("slug") || "").toLowerCase().trim();
  const host = req.headers.get("host") || req.headers.get("x-forwarded-host");
  const slug = urlSlug || extractSlugFromHost(host);

  if (!slug) return Response.json({ error: "No subdomain" }, { status: 400 });

  const { data, error } = await sb
    .from("companies")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (error || !data) return Response.json({ error: "Company not found" }, { status: 404 });
  return Response.json(data);
}
