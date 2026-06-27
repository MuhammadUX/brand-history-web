import { NextResponse, after } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getLlmProvider } from "@/lib/ai/factory";
import { classifyAiError } from "@/lib/ai/classify-error";
import type { BrandDraft } from "@/lib/ai/llm-provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// The grounded provider call (web-search) can take 30–90s; give it headroom.
export const maxDuration = 300;

interface RunRow {
  id: string;
  status: string;
  input_name: string;
  languages: string[] | null;
  hints: {
    sector_slug?: string | null;
    region?: string | null;
    url?: string | null;
    ai_provider?: string | null;
  } | null;
}

/**
 * Background worker for the AI Profile Builder.
 *
 * The `startRun` server action inserts a 'gathering' run and POSTs here, then
 * redirects immediately. This route authenticates the server-to-server call,
 * returns 202 right away, and runs the long (web-grounded) provider call inside
 * an `after()` callback so it survives past the HTTP response and isn't killed
 * mid-redirect. All writes use the service-role client (no user cookie here).
 *
 * Provider isolation: the worker reads the operator's chosen model from
 * `run.hints.ai_provider` and calls getLlmProvider(<that model>), so a run
 * started with Gemini uses ONLY Gemini and a Claude run uses ONLY Claude.
 *
 * Idempotency: if the run is not still 'gathering' (already processed, failed,
 * cancelled, or accepted), it returns 200 without reprocessing.
 */
export async function POST(req: Request) {
  // Auth: shared internal secret (reuse CRON_SECRET). Fail closed if unset.
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-internal-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let runId: string | undefined;
  try {
    const body = (await req.json()) as { runId?: string };
    runId = body?.runId;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (!runId) {
    return NextResponse.json({ ok: false, reason: "missing_run_id" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: run, error } = await admin
    .from("profile_builder_runs")
    .select("id, status, input_name, languages, hints")
    .eq("id", runId)
    .maybeSingle<RunRow>();

  if (error || !run) {
    console.error("[ai-builder/run] run not found:", runId, error?.message);
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  // Idempotency: only process runs that are still gathering.
  if (run.status !== "gathering") {
    return NextResponse.json({ ok: true, reason: "already_handled", status: run.status });
  }

  // Schedule the long work to run after the response is sent, then 202 fast.
  after(async () => {
    const languages = run.languages ?? ["en", "ar"];
    try {
      // Provider isolation: use ONLY the model the operator selected.
      const provider = getLlmProvider(run.hints?.ai_provider ?? undefined);
      const result = await provider.draftBrandProfile({
        name: run.input_name,
        hints: run.hints ?? undefined,
        languages,
      });

      // Flag "found little" so the review screen can surface a clear notice.
      const noFindings = result.findings === "none";
      const flaggedDraft: BrandDraft = { ...result.draft, no_findings: noFindings };

      const { error: updErr } = await admin
        .from("profile_builder_runs")
        .update({
          draft: flaggedDraft,
          status: "draft_ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        // Guard against a concurrent cancel: only flip a still-gathering run.
        .eq("status", "gathering");
      if (updErr) {
        console.error("[ai-builder/run] draft_ready update failed:", updErr.message);
      }
    } catch (e) {
      console.error("[ai-builder/run] provider error:", e);
      const error_code = classifyAiError(e);
      await admin
        .from("profile_builder_runs")
        .update({
          status: "failed",
          error_code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .eq("status", "gathering");
      // Audit the failure. No operator context here (server-to-server), so the
      // actor columns stay null; detail records that the worker classified it.
      await admin.from("audit_log").insert({
        actor_id: null,
        actor_email: null,
        action: "ai_run_failed",
        entity: "profile_builder_run",
        entity_id: run.id,
        detail: { error_code, stage: "worker" },
      });
    }
  });

  return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
}
