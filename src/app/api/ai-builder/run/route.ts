import { NextResponse, after } from "next/server";
import { runDraftWorker } from "@/lib/ai/run-worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// The grounded provider call (web-search) can take 30–90s; give it headroom.
export const maxDuration = 300;

/**
 * Manual / fallback trigger for the AI Profile Builder worker.
 *
 * The PRIMARY path is `startRun`, which schedules `runDraftWorker` via `after()`
 * inside its own server-action invocation (no self-fetch) — this avoids Vercel
 * Deployment Protection intercepting a server-to-server call on preview
 * deployments. This route remains a valid manual/fallback trigger that reuses
 * the SAME worker logic, authenticated with the shared internal secret
 * (CRON_SECRET). It returns 202 immediately and runs the work in `after()`.
 *
 * runDraftWorker is idempotent: if the run is not still 'gathering' it no-ops.
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

  // Run the worker after the response is sent (survives past the HTTP response,
  // bounded by maxDuration). The worker loads the run with the service-role
  // client, checks idempotency, and writes draft_ready / failed itself.
  after(() => runDraftWorker(runId!));

  return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
}
