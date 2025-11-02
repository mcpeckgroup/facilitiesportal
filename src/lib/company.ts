// src/lib/company.ts

export type Company = { id: string; slug: string; name: string };

let cachedCompany: Company | null = null;

/**
 * Extracts a tenant slug from the host (e.g., "pharmetric.facilitiesportal.com" -> "pharmetric").
 * If the host is just "www.facilitiesportal.com" or "facilitiesportal.com", returns null.
 */
function hostToSlug(host: string): string | null {
  try {
    const h = (host || "").toLowerCase();
    const parts = h.split(".");
    if (parts.length >= 3) {
      // e.g., www.pharmetric.facilitiesportal.com OR pharmetric.facilitiesportal.com
      return parts[0] === "www" ? parts[1] : parts[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Client-side helper: resolves the active company from subdomain or ?slug= param.
 * Caches the result for this session to avoid extra network calls.
 */
export async function getCompany(): Promise<Company> {
  if (cachedCompany) return cachedCompany;

  // Must run in the browser (uses window)
  const url = new URL(window.location.href);
  const urlSlug = url.searchParams.get("slug");

  const res = await fetch(
    `/api/company/by-host${urlSlug ? `?slug=${encodeURIComponent(urlSlug)}` : ""}`,
    {
      method: "GET",
      headers: {
        "x-app-host": window.location.host,
        "x-app-proto": window.location.protocol,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Company resolve failed: ${await res.text()}`);
  }

  const company = (await res.json()) as Company;
  cachedCompany = company;
  return company;
}

/** Utility exposed for tests/edge cases */
export function extractSlugFromHost(host: string): string | null {
  return hostToSlug(host);
}
 
