import { NextResponse } from "next/server";
import { getOperatorAccess } from "@/lib/admin";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { sanitizeSvg } from "@/lib/sanitize-svg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "brand-assets";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Allowlisted MIME -> canonical extension. The browser-supplied content-type is
// validated against this list; anything else is rejected. We never trust the
// client filename for the stored extension.
const MIME_EXT: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Server-side, operator-gated upload for brand-asset image files (WEB-1 /
 * STOR-1 / WEB-6). Replaces the previous direct browser->bucket upload.
 *
 * Hardening:
 *  - Operator-gated via getOperatorAccess (editor/admin only).
 *  - Allowlist MIME (svg/png/jpeg/webp) + 5 MB size cap.
 *  - SVG is sanitized server-side (strip scripts/handlers/remote refs) before
 *    storage, so a direct bucket-URL open cannot execute (stored-XSS).
 *  - Upload uses the SERVICE-ROLE admin client to a SERVER-CONTROLLED path
 *    (`brands/<brandId>/<uuid>.<ext>` or `ai-drafts/<runId>/<uuid>.<ext>`), so
 *    no operator can overwrite another operator's object and clients can no
 *    longer write to the bucket directly (storage RLS is service-role-only).
 *
 * Body: multipart/form-data with:
 *   - file: the single file
 *   - kind: "brand" | "draft"
 *   - id:   brandId (for kind=brand) or runId (for kind=draft)
 *
 * Returns: { ok: true, url, ext } or { ok: false, error }.
 */
export async function POST(req: Request) {
  // Operator gate.
  const access = await getOperatorAccess();
  if (access.status === "unauthenticated") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (access.status !== "ok") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const rawId = String(form.get("id") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  // Size cap (defense-in-depth; the bucket also enforces a limit).
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "empty_file" }, { status: 400 });
  }

  // MIME allowlist — trust only the declared content-type against our allowlist.
  const mime = (file.type || "").toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 415 });
  }

  // Server-controlled path. Validate the id is a plausible token (uuid-ish) so
  // it cannot inject path traversal; fall back to rejecting on anything weird.
  const idOk = /^[a-zA-Z0-9_-]{1,64}$/.test(rawId);
  if (!idOk || (kind !== "brand" && kind !== "draft")) {
    return NextResponse.json({ ok: false, error: "bad_target" }, { status: 400 });
  }
  const uuid =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ?? `${Date.now()}`;
  const prefix = kind === "brand" ? `brands/${rawId}` : `ai-drafts/${rawId}`;
  const path = `${prefix}/${uuid}.${ext}`;

  // Build the body + content-type. SVG is sanitized; raster formats pass through
  // as raw bytes with an explicit safe content-type (no browser-supplied type).
  let body: Buffer | ArrayBuffer;
  if (mime === "image/svg+xml") {
    const text = await file.text();
    const cleaned = sanitizeSvg(text);
    body = Buffer.from(cleaned, "utf8");
  } else {
    body = await file.arrayBuffer();
  }

  const admin = createAdminSupabase();
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, body, {
    contentType: mime,
    cacheControl: "3600",
    upsert: true,
    // Force a download-style disposition so a direct open is treated as an
    // attachment rather than rendered as an active document (defense-in-depth
    // alongside SVG sanitization).
    headers: { "content-disposition": "attachment" },
  });

  if (upErr) {
    console.error("[upload-asset] upload failed:", upErr.message);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  return NextResponse.json({ ok: true, url, ext }, { status: 200 });
}
