import "server-only";

import { createAdminSupabase } from "@/lib/supabase-admin";
import { getLlmProvider } from "@/lib/ai/factory";
import { classifyAiError } from "@/lib/ai/classify-error";
import type { BrandDraft } from "@/lib/ai/llm-provider";

interface RunRow {
  id: string;
  status: string;
  input_name: string;
  languages: string[] | null;
  hints: {
    sector_slug?: string | null;
    region?: string | null;
    url?: string | null;
    guidelines_url?: string | null;
    ai_provider?: string | null;
  } | null;
}

/**
 * Background worker for the AI Profile Builder.
 *
 * Runs the long (30–90s, web-grounded) provider call and writes the result back
 * to the run row. It is invoked from `startRun` via `after()` (same server-action
 * invocation, after the response/redirect is sent) so it does NOT make a
 * server-to-server HTTP call — avoiding Vercel Deployment Protection on preview
 * deployments, which would intercept a self-fetch and leave the run stuck on
 * 'gathering' forever. It is also reused by the `/api/ai-builder/run` route as a
 * manual/fallback trigger.
 *
 * Uses the service-role admin client for all reads/writes: it runs after the
 * response, where no user cookie is guaranteed.
 *
 * Provider isolation: reads the operator's chosen model from
 * `run.hints.ai_provider` and calls getLlmProvider(<that model>), so a run
 * started with Gemini uses ONLY Gemini and a Claude run uses ONLY Claude.
 *
 * Idempotency: if the run is not still 'gathering' (already processed, failed,
 * cancelled, or accepted), it returns without reprocessing. All writes are
 * guarded with `.eq('status','gathering')` so a concurrent Cancel wins.
 */
export async function runDraftWorker(runId: string): Promise<void> {
  const admin = createAdminSupabase();

  const { data: run, error } = await admin
    .from("profile_builder_runs")
    .select("id, status, input_name, languages, hints")
    .eq("id", runId)
    .maybeSingle<RunRow>();

  if (error || !run) {
    console.error("[ai-builder/worker] run not found:", runId, error?.message);
    return;
  }

  // Idempotency: only process runs that are still gathering.
  if (run.status !== "gathering") {
    return;
  }

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
      console.error("[ai-builder/worker] draft_ready update failed:", updErr.message);
    }
  } catch (e) {
    console.error("[ai-builder/worker] provider error:", e);
    const error_code = classifyAiError(e);
    const error_detail = (e instanceof Error ? e.message : String(e)).slice(
      0,
      4000
    );
    await admin
      .from("profile_builder_runs")
      .update({
        status: "failed",
        error_code,
        error_detail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("status", "gathering");
    // Audit the failure. No operator context here (post-response), so the actor
    // columns stay null; detail records that the worker classified it.
    await admin.from("audit_log").insert({
      actor_id: null,
      actor_email: null,
      action: "ai_run_failed",
      entity: "profile_builder_run",
      entity_id: run.id,
      detail: { error_code, stage: "worker" },
    });
  }
}
