// src/app/api/company/by-host/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // no caching
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.toLowerCase();
  const parts = h.split(".").filter(Boolean);
  // e.g. pharmetriclab.facilitiesportal.com -> ["pharmetriclab","facilitiesportal","com"]
  if (parts.length >= 3) return parts[0] === "www" ? parts[1] : parts[0];
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnon) {
      return new Response("Missing Supabase env vars", { status: 500 });
    }

    const search = req.nextUrl.searchParams;
    let slug = (search.get("slug") || "").toLowerCase().trim();

    if (!slug) {
      const host = req.headers.get("host") || req.headers.get("x-app-host");
      slug = extractSlugFromHost(host) || "";
    }

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "No slug provided and no subdomain detected",
          hint: "Add ?slug=pharmetriclab or visit a subdomain like pharmetriclab.facilitiesportal.com",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    const { data, error } = await supabase
      .from("companies")
      .select("id, slug, name")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: `Company not found for slug "${slug}"` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
