"use client";

import { useEffect, useState } from "react";
import { getCompany } from "@/lib/company";

type Company = { id: string; slug: string; name: string };

export default function TenantHeader() {
  const [company, setCompany] = useState<Company | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [triedSvg, setTriedSvg] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const c = await getCompany(); // expects { id, slug, name }
        if (cancel) return;
        setCompany(c);
        // Try PNG first; fallback to SVG on error
        setSrc(`/tenants/${c.slug}.png`);
      } catch {
        // ignore; no header if company can't be resolved
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!company) return null;

  return (
    <div className="w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        {src ? (
          <img
            src={src}
            alt={`${company.name} logo`}
            className="h-10 w-auto"
            onError={() => {
              // one-time fallback to svg if png missing
              if (!triedSvg) {
                setTriedSvg(true);
                setSrc(`/tenants/${company.slug}.svg`);
              } else {
                setSrc(null); // show text fallback if both missing
              }
            }}
          />
        ) : (
          <div className="text-lg font-semibold">{company.name}</div>
        )}
      </div>
    </div>
  );
}
