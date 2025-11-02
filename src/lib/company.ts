// src/lib/company.ts
export type Company = { id: string; slug: string; name: string };

let cachedCompany: Company | null = null;

export async function getCompany(): Promise<Company> {
  if (cachedCompany) return cachedCompany;

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
