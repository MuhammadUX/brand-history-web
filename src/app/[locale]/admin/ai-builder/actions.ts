"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { classifyAiError } from "@/lib/ai/classify-error";
import { redactSecrets } from "@/lib/redact-secrets";
import {
  requireOperatorAction,
  slugify,
  writeAudit,
  type Operator,
} from "@/lib/admin";
import { isHighConfidenceSourced, type BrandDraft } from "@/lib/ai/llm-provider";
import { runDraftWorker } from "@/lib/ai/run-worker";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function operatorClient() {
  const operator = await requireOperatorAction();
  const supabase = await createServerSupabase();
  return { operator, supabase };
}

/**
 * Step 1: create a 'gathering' run, then schedule the long (30–90s, web-grounded)
 * provider call via `after()` in THIS same server-action invocation and redirect
 * immediately.
 *
 * We deliberately do NOT make a server-to-server fetch to our own
 * `/api/ai-builder/run` route: on Vercel preview deployments, Deployment
 * Protection intercepts that self-call before it reaches the route, so the run
 * stayed 'gathering' forever. `after()` runs the worker after the response/redirect
 * is sent, inside the same function (bounded by the page's maxDuration), which
 * avoids the protection wall entirely.
 *
 * The operator's chosen provider is persisted inside `hints.ai_provider` so the
 * worker uses ONLY that model (provider isolation) — no schema migration needed.
 */
export async function startRun(locale: string, fd: FormData): Promise<void> {
  const { operator, supabase } = await operatorClient();

  const input_name = str(fd, "input_name");
  if (!input_name) {
    redirect(`/${locale}/admin/ai-builder?error=name`);
  }

  const langs: string[] = [];
  if (fd.get("lang_en")) langs.push("en");
  if (fd.get("lang_ar")) langs.push("ar");
  const languages = langs.length ? langs : ["en", "ar"];

  // Operator-selected AI provider for this run (gemini | claude). Stored inside
  // hints so the background worker knows which AI to use exclusively.
  const aiProvider = str(fd, "ai_provider");

  const hints = {
    sector_slug: str(fd, "sector_slug") || null,
    region: str(fd, "region") || null,
    url: str(fd, "url") || null,
    guidelines_url: str(fd, "guidelines_url") || null,
    ai_provider: aiProvider || null,
  };

  // Create the run in 'gathering' state first (auditable, cancellable).
  const { data: run, error } = await supabase
    .from("profile_builder_runs")
    .insert({
      input_name,
      hints,
      languages,
      status: "gathering",
      created_by: operator.id,
    })
    .select("id")
    .single();

  if (error || !run) {
    console.error("startRun insert error:", error?.message);
    redirect(`/${locale}/admin/ai-builder?error=create`);
  }

  await writeAudit(supabase, operator, "ai_run_created", "profile_builder_run", run.id, {
    input_name,
    hints,
    ai_provider: aiProvider || "(default)",
  });

  // Run the provider call SYNCHRONOUSLY (awaited) before redirecting. Vercel
  // background execution proved unreliable on this deployment — BOTH a
  // self-fetch to /api/ai-builder/run (intercepted by preview Deployment
  // Protection) AND next/server after() left the run stuck on 'gathering'
  // forever (the worker body never ran/completed, so it never wrote
  // draft_ready or failed). Doing the work inline guarantees a terminal state.
  // The page segment sets maxDuration=300 for headroom and the Start button
  // shows a pending state during the call.
  try {
    await runDraftWorker(run.id);
  } catch (e) {
    // Hard failure before the worker could record one (e.g. admin client / env
    // misconfig that throws before its own try/catch). Mark the run failed via
    // the operator's client so it never hangs on 'gathering'.
    console.error("startRun worker error:", e);
    await supabase
      .from("profile_builder_runs")
      .update({
        status: "failed",
        error_code: classifyAiError(e),
        error_detail: redactSecrets(
          e instanceof Error ? e.message : String(e)
        ).slice(0, 4000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("status", "gathering");
  }

  revalidatePath(`/${locale}/admin/ai-builder`);
  redirect(`/${locale}/admin/ai-builder/${run.id}`);
}

/** Cancel a gathering/draft_ready run -> discarded. */
export async function cancelRun(locale: string, runId: string): Promise<void> {
  const { operator, supabase } = await operatorClient();
  await supabase
    .from("profile_builder_runs")
    .update({ status: "discarded", updated_at: new Date().toISOString() })
    .eq("id", runId)
    .in("status", ["gathering", "draft_ready"]);
  await writeAudit(supabase, operator, "ai_run_discarded", "profile_builder_run", runId, {});
  revalidatePath(`/${locale}/admin/ai-builder`);
  redirect(`/${locale}/admin/ai-builder`);
}

/** Hard-delete a single builder run (any status). Operator-gated + audited. */
export async function deleteRun(locale: string, runId: string): Promise<void> {
  const { operator, supabase } = await operatorClient();
  // Verify the row is actually gone — a silent 0-row delete (e.g. a missing RLS
  // policy) must surface as an error, not pretend success.
  const { data: deleted, error } = await supabase
    .from("profile_builder_runs")
    .delete()
    .eq("id", runId)
    .select("id");
  if (error || !deleted || deleted.length === 0) {
    console.error("deleteRun failed:", error?.message ?? "0 rows deleted (RLS?)");
    redirect(`/${locale}/admin/ai-builder?error=delete`);
  }
  await writeAudit(supabase, operator, "ai_run_deleted", "profile_builder_run", runId, {});
  revalidatePath(`/${locale}/admin/ai-builder`);
  redirect(`/${locale}/admin/ai-builder`);
}

/**
 * Delete ALL builder runs that have not been turned into a brand (i.e. status
 * != 'accepted'). Clears out drafts/failed/discarded runs in one go.
 */
export async function deleteAllRuns(locale: string): Promise<void> {
  const { operator, supabase } = await operatorClient();
  const { error } = await supabase
    .from("profile_builder_runs")
    .delete()
    .neq("status", "accepted")
    .select("id");
  if (error) {
    console.error("deleteAllRuns failed:", error.message);
    redirect(`/${locale}/admin/ai-builder?error=delete`);
  }
  await writeAudit(supabase, operator, "ai_runs_cleared", "profile_builder_run", null, {});
  revalidatePath(`/${locale}/admin/ai-builder`);
  redirect(`/${locale}/admin/ai-builder`);
}

export interface CreateSectorResult {
  ok: boolean;
  message?: "forbidden" | "validation" | "error";
  sectorId?: string;
  slug?: string;
}

/**
 * Create (or pick up an existing) sector from the AI-builder review screen.
 * Operator-gated + audited. Slugifies the proposed slug, inserts with
 * `on conflict (slug) do nothing`, and always resolves the row's id so the
 * caller can link the brand to it whether it was just created or already
 * existed. Server-validated: name_en is required.
 */
export async function createSector(
  locale: string,
  input: { slug: string; name_en: string; name_ar: string }
): Promise<CreateSectorResult> {
  try {
    const { operator, supabase } = await operatorClient();

    const name_en = (input.name_en ?? "").trim();
    const name_ar = (input.name_ar ?? "").trim() || name_en;
    const slug = slugify(input.slug || name_en);
    if (!slug || !name_en) {
      return { ok: false, message: "validation" };
    }

    // Next sort_order = max + 1 (keeps the dropdown ordering stable).
    const { data: last } = await supabase
      .from("sectors")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = ((last?.sort_order as number | undefined) ?? 0) + 1;

    // Insert; ignore conflict so a duplicate slug is a no-op (idempotent).
    const { error: insErr } = await supabase
      .from("sectors")
      .insert({ slug, name_en, name_ar, sort_order })
      .select("id");
    // 23505 = unique_violation (slug already exists) — treated as success below.
    if (insErr && insErr.code !== "23505") {
      console.error("createSector insert error:", insErr.message);
      return { ok: false, message: "error" };
    }

    // Resolve the id (whether just inserted or pre-existing).
    const { data: row } = await supabase
      .from("sectors")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!row?.id) return { ok: false, message: "error" };

    await writeAudit(supabase, operator, "sector_created", "sector", row.id, {
      slug,
      name_en,
      name_ar,
      via: "ai-builder",
    });

    revalidatePath(`/${locale}/admin/ai-builder`);
    return { ok: true, sectorId: row.id, slug };
  } catch (e) {
    console.error("createSector error:", e);
    return { ok: false, message: "forbidden" };
  }
}

export interface CreateDraftResult {
  ok: boolean;
  message?: "forbidden" | "notReady" | "error" | "validation";
  validation?: string[];
  brandId?: string;
}

/**
 * Step 3 -> "Create draft brand". Assembles ACCEPTED fields into a NEW brand
 * row. Hard rules enforced server-side:
 *  - publication_state is asserted to 'draft' (never beyond).
 *  - bulk "accept all high-confidence" only accepts H + sourced items; the
 *    client cannot smuggle low/unsourced items via the bulk path.
 *
 * `accepted` is a JSON string of the operator's per-item accept decisions plus
 * any inline edits, but each item is re-validated against the stored draft.
 */
export async function createDraftBrand(
  locale: string,
  runId: string,
  fd: FormData
): Promise<CreateDraftResult> {
  let operator: Operator;
  try {
    const ctx = await operatorClient();
    operator = ctx.operator;
    const supabase = ctx.supabase;

    const { data: run } = await supabase
      .from("profile_builder_runs")
      .select("id, input_name, status, draft, brand_id, hints, languages")
      .eq("id", runId)
      .maybeSingle();

    if (!run) return { ok: false, message: "error" };
    if (run.status !== "draft_ready") return { ok: false, message: "notReady" };
    if (run.brand_id) return { ok: true, brandId: run.brand_id };

    const draft = run.draft as BrandDraft | null;
    if (!draft) return { ok: false, message: "error" };

    // Parse operator decisions + edits from the form.
    // Shape: { fields: {overview,summary,sector_slug,founded_year,...}, accept: {key:bool}, bulkHigh:bool,
    //          added: { colors:[{name,hex,role}], assets:[{asset_type,name_en,name_ar}] } }
    let decisions: {
      fields?: Record<string, string>;
      accept?: Record<string, boolean>;
      bulkHigh?: boolean;
      added?: {
        colors?: Array<{ name?: string; hex?: string; role?: string }>;
        assets?: Array<{
          asset_type?: string;
          name_en?: string;
          name_ar?: string;
          image_url?: string;
          ext?: string;
        }>;
      };
    } = {};
    try {
      decisions = JSON.parse(str(fd, "decisions") || "{}");
    } catch {
      decisions = {};
    }
    const editedFields = decisions.fields ?? {};
    const accept = decisions.accept ?? {};
    const bulkHigh = !!decisions.bulkHigh;

    const meta = draft.fields_meta || {};
    // Server-enforced acceptance: an item is accepted if explicitly accepted,
    // OR if bulkHigh is on AND it is High-confidence + sourced. Low/unsourced
    // items are NEVER accepted via the bulk path.
    const isAccepted = (key: string): boolean => {
      if (accept[key] === true) return true;
      if (accept[key] === false) return false;
      if (bulkHigh && isHighConfidenceSourced(meta[key])) return true;
      return false;
    };

    const text = (key: string, fallback: string): string => {
      const v = editedFields[key];
      return v !== undefined ? v : fallback;
    };

    // Assemble brand basics from accepted scalar blocks.
    const name_en = run.input_name;
    const overviewAccepted = isAccepted("overview");
    const summaryAccepted = isAccepted("summary");
    const sectorAccepted = isAccepted("sector");
    const foundedAccepted = isAccepted("founded_year");

    const summary_en = overviewAccepted
      ? text("overview_en", draft.overview_en)
      : summaryAccepted
        ? text("summary_en", draft.summary_en)
        : null;
    const summary_ar = overviewAccepted
      ? text("overview_ar", draft.overview_ar)
      : summaryAccepted
        ? text("summary_ar", draft.summary_ar)
        : null;

    // Right-rail validation checklist (server-enforced).
    const fails: string[] = [];
    if (!name_en?.trim()) fails.push("vName");

    const acceptedColors = draft.colors.filter((_, i) => isAccepted("color:" + i));
    const acceptedAssets = draft.assets.filter((_, i) => isAccepted("asset:" + i));
    const acceptedTimeline = draft.timeline.filter((_, i) => isAccepted("timeline:" + i));

    // Operator-added items (manual completion of what the AI missed). Each is
    // server-validated here: invalid rows are silently dropped so a malformed
    // client payload can never insert bad data, while well-formed rows are kept.
    const COLOR_ROLES = new Set(["primary", "secondary", "neutral", "accent"]);
    const HEX_RE = /^#[0-9a-fA-F]{6}$/;
    const cap = (s: unknown, n: number): string =>
      String(s ?? "").trim().slice(0, n);

    const addedColors = (decisions.added?.colors ?? [])
      .map((c) => ({
        name: cap(c.name, 80),
        hex: cap(c.hex, 7),
        role: cap(c.role, 20).toLowerCase(),
      }))
      .filter(
        (c) => c.name && HEX_RE.test(c.hex) && COLOR_ROLES.has(c.role)
      )
      .map((c) => ({
        name: c.name,
        hex: c.hex,
        role: c.role,
        confidence: 1,
        source: "",
      }));

    // Accept an optional uploaded image: must be a string URL (http/https) and
    // length-capped. Anything malformed is dropped to null (asset still kept).
    const ALLOWED_EXT = new Set(["svg", "png", "jpg", "jpeg", "webp"]);
    const cleanImageUrl = (raw: unknown): string | null => {
      const s = cap(raw, 2048);
      if (!s) return null;
      return /^https?:\/\//i.test(s) ? s : null;
    };
    const cleanExt = (raw: unknown): string | null => {
      const e = cap(raw, 8).toLowerCase().replace(/^\./, "");
      return ALLOWED_EXT.has(e) ? e : null;
    };

    const addedAssets = (decisions.added?.assets ?? [])
      .map((a) => ({
        asset_type: cap(a.asset_type, 40),
        name_en: cap(a.name_en, 120),
        name_ar: cap(a.name_ar, 120),
        image_url: cleanImageUrl(a.image_url),
        ext: cleanExt(a.ext),
      }))
      .filter((a) => a.asset_type && (a.name_en || a.name_ar))
      .map((a) => ({
        asset_type: a.asset_type,
        name_en: a.name_en || a.name_ar,
        name_ar: a.name_ar || a.name_en,
        image_url: a.image_url,
        // Persist the uploaded file's format when known; else the default pair.
        formats: a.ext ? [a.ext] : ["svg", "png"],
      }));

    const allColors = [...acceptedColors, ...addedColors];
    const allAssets = [...acceptedAssets, ...addedAssets];

    if (allColors.length < 1) fails.push("vColor");
    if (allAssets.length < 1) fails.push("vAsset");
    if (!summary_en?.trim() || !summary_ar?.trim()) fails.push("vOverview");

    if (fails.length > 0) {
      return { ok: false, message: "validation", validation: fails };
    }

    // Resolve sector_slug -> sector_id (only if accepted).
    let sector_id: string | null = null;
    const sectorSlug = sectorAccepted
      ? text("sector_slug", draft.sector_slug ?? "")
      : "";
    if (sectorSlug) {
      const { data: sector } = await supabase
        .from("sectors")
        .select("id")
        .eq("slug", sectorSlug)
        .maybeSingle();
      sector_id = sector?.id ?? null;
    }

    const founded_year = foundedAccepted
      ? Number.parseInt(text("founded_year", String(draft.founded_year ?? "")), 10) ||
        null
      : null;

    const slug = slugify(name_en);

    // HARD ASSERTION: the builder must NEVER create anything beyond 'draft'.
    const publication_state = "draft";
    if (publication_state !== "draft") {
      throw new Error("ai-builder must only create draft brands");
    }

    const { data: brand, error: brandErr } = await supabase
      .from("brands")
      .insert({
        name_en,
        name_ar: name_en, // operator refines AR in the editor
        slug,
        sector_id,
        region: (run.hints as { region?: string })?.region || "KSA",
        founded_year,
        summary_en,
        summary_ar,
        primary_color:
          allColors.find((c) => c.role === "primary")?.hex ||
          allColors[0]?.hex ||
          "#3B5BDB",
        claim_status: "unclaimed",
        publication_state, // asserted 'draft'
        source: "ai",
        ai_run_id: run.id,
        created_by: operator.id,
        updated_by: operator.id,
        last_updated_at: new Date().toISOString(),
        row_version: 0,
      })
      .select("id")
      .single();

    if (brandErr || !brand) {
      console.error("createDraftBrand brand insert error:", brandErr?.message);
      return { ok: false, message: "error" };
    }

    // Children: accepted + operator-added colors / assets, accepted timeline.
    if (allColors.length) {
      await supabase.from("brand_colors").insert(
        allColors.map((col, i) => ({
          brand_id: brand.id,
          name: col.name,
          hex: col.hex,
          // Prefer the AI-extracted palette role; fall back to position-based.
          role: col.role || (i === 0 ? "primary" : "secondary"),
          sort_order: i,
        }))
      );
    }
    if (allAssets.length) {
      await supabase.from("brand_assets").insert(
        allAssets.map((a, i) => {
          // Added assets may carry an uploaded image_url + per-file formats;
          // accepted (AI-drafted) assets do not. Read them defensively.
          const withImg = a as { image_url?: string | null; formats?: string[] };
          return {
            brand_id: brand.id,
            asset_type: a.asset_type,
            name_en: a.name_en,
            name_ar: a.name_ar,
            download_policy: "host",
            image_url: withImg.image_url ?? null,
            formats: withImg.formats ?? ["svg", "png"],
            is_archived: false,
            sort_order: i,
          };
        })
      );
    }
    if (acceptedTimeline.length) {
      await supabase.from("timeline_entries").insert(
        acceptedTimeline.map((tl, i) => ({
          brand_id: brand.id,
          year: tl.year,
          title_en: tl.title_en,
          title_ar: tl.title_ar,
          description_en: tl.description_en,
          description_ar: tl.description_ar,
          category: "identity_update",
          change_kind: tl.change_kind ?? null,
          sort_order: i,
        }))
      );
    }

    // Mark run accepted + link brand.
    await supabase
      .from("profile_builder_runs")
      .update({
        status: "accepted",
        brand_id: brand.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    await writeAudit(supabase, operator, "ai_draft_created", "brand", brand.id, {
      run_id: run.id,
      accepted_colors: acceptedColors.length,
      accepted_assets: acceptedAssets.length,
      accepted_timeline: acceptedTimeline.length,
      added_colors: addedColors.length,
      added_assets: addedAssets.length,
      source: "ai",
    });

    revalidatePath(`/${locale}/admin/brands`);
    revalidatePath(`/${locale}/admin/ai-builder`);
    return { ok: true, brandId: brand.id };
  } catch (e) {
    console.error("createDraftBrand error:", e);
    return { ok: false, message: "forbidden" };
  }
}
