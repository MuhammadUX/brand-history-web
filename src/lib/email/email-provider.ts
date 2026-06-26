// Transactional email sender for APP-SENT emails (Pro receipts, welcome, etc.).
//
// NOTE: the auth lifecycle emails (verify, password reset, magic link) are sent
// by Supabase Auth via its Custom SMTP setting — NOT through this module. This is
// only for emails the application itself triggers.
//
// Uses Resend's HTTP API (no SDK, no SMTP from serverless). It no-ops safely
// until RESEND_API_KEY is configured, so it is safe to deploy before setup.

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/** From address — override with EMAIL_FROM env (must be on the Resend-verified domain). */
const FROM =
  process.env.EMAIL_FROM || "Brand History <no-reply@brandshistory.com>";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Not configured yet — skip silently so flows don't break before setup.
    console.warn("[email] RESEND_API_KEY not set — skipping:", input.subject);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email] Resend error", res.status, text);
      return { ok: false, error: `resend_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[email] send failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
