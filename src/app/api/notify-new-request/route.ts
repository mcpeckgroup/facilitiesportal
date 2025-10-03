export const dynamic = "force-dynamic";

type NewRequestRecord = {
  id?: string;
  title: string;
  description: string;
  business: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  created_at?: string;
  status?: string;
};

export async function POST(req: Request) {
  try {
    const { record } = (await req.json()) as { record: NewRequestRecord };

    if (!record?.title) {
      return new Response("Missing record payload", { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response("Missing RESEND_API_KEY", { status: 500 });
    }

    const to = process.env.NOTIFY_TO || "eric@pharmetriclab.com";
    const from = process.env.NOTIFY_FROM || "no-reply@yourdomain.com";

    const html = `
      <h2>New Work Order Request</h2>
      <p><b>Title:</b> ${escapeHtml(record.title)}</p>
      <p><b>Description:</b> ${escapeHtml(record.description)}</p>
      <p><b>Business:</b> ${escapeHtml(record.business)}</p>
      <p><b>Priority:</b> ${escapeHtml(record.priority)}</p>
      <p><b>Submitted by:</b> ${escapeHtml(record.submitter_name)} (${escapeHtml(record.submitter_email)})</p>
      <p><b>Submitted at:</b> ${new Date(record.created_at || Date.now()).toLocaleString()}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New Request Submitted: ${record.title}`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(`Resend error: ${text}`, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    return new Response(String(err?.message || err), { status: 500 });
  }
}

// Basic HTML escape to keep emails safe
function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
