"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) window.location.assign("/");
    })();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErr("Please enter a valid email.");
      return;
    }

    setSending(true);
    try {
      // IMPORTANT: redirect back to the SAME subdomain’s callback page
      const origin = window.location.origin; // e.g. https://infuserve.facilitiesportal.com
      const emailRedirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo },
      });

      if (error) setErr(error.message);
      else setMsg("Check your email for a login link.");
    } catch (e: any) {
      setErr(e?.message || "Failed to send magic link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign In</h1>

      {msg && <div className="mb-3 rounded border border-green-300 bg-green-50 text-green-800 p-3">{msg}</div>}
      {err && <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 p-3">{err}</div>}

      <form onSubmit={sendMagicLink} className="space-y-4 border rounded-xl p-5 shadow bg-white">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
        <input
            type="email"
            className="w-full border rounded p-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send Magic Link"}
        </button>
      </form>

      <div className="mt-4">
        <a href="/" className="text-blue-600 hover:underline">Back to Home</a>
      </div>
    </div>
  );
}
