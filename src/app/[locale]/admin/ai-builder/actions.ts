"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  requireOperatorAction,
  slugify,
  writeAudit,
  type Operator,
} from "@/lib/admin";
import {
  isHighConfidenceSourced,
  type BrandDraft,
} from "@/lib/ai/llm-provider";
import { getLlmProvider } from "@/lib/ai/factory";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function operatorClient() {
  const operator = await requireOperatorAction();
  const supabase = await createServerSupabase();
  return { operator, supabase };
}

/**
 * Step 1: create a run, invoke the stub provider to produce a draft, mark it
 * draft_ready, then redirect to the review workspace (Step 3).
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

  const hints = {
    sector_slug: str(fd, "sector_slug") || null,
    region: str(fd, "region") || null,
    url: str(fd, "url") || null,
  };

  // Operator-selected AI provider for this run (gemini | claude). Falls back to
  // the env priority list if blank/unknown.
  const aiProvider = str(fd, "ai_provider");

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

  // Run the (synchronous) stub provider. NEVER calls a real network.
  let draft: BrandDraft;
  let findings: string;
  try {
    const provider = getLlmProvider(aiProvider);
    const result = await provider.draftBrandProfile({
      name: input_name,
      hints,
      languages,
    });
    draft = result.draft;
    findings = result.findings;
  } catch (e) {
    console.error("startRun provider error:", e);
    await supabase
      .from("profile_builder_runs")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", run.id);
    redirect(`/${locale}/admin/ai-builder/${run.id}`);
  }

  // The stub always produces a (possibly empty) draft, so the run is always
  // 'draft_ready' for review. When findings are "none", flag the draft so the
  // review screen can surface a clear "found little — build manually" notice.
  const noFindings = findings === "none";
  const flaggedDraft: BrandDraft = { ...draft, no_findings: noFindings };

  await supabase
    .from("profile_builder_runs")
    .update({
      draft: flaggedDraft,
      status: "draft_ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", run.id);

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
    // Shape: { fields: {overview,summary,sector_slug,founded_year,...}, accept: {key:bool}, bulkHigh:bool }
    let decisions: {
      fields?: Record<string, string>;
      accept?: Record<string, boolean>;
      bulkHigh?: boolean;
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

    if (acceptedColors.length < 1) fails.push("vColor");
    if (acceptedAssets.length < 1) fails.push("vAsset");
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
        primary_color: acceptedColors[0]?.hex || "#3B5BDB",
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

    // Children: accepted colors / assets / timeline.
    if (acceptedColors.length) {
      await supabase.from("brand_colors").insert(
        acceptedColors.map((col, i) => ({
          brand_id: brand.id,
          name: col.name,
          hex: col.hex,
          role: i === 0 ? "primary" : "secondary",
          sort_order: i,
        }))
      );
    }
    if (acceptedAssets.length) {
      await supabase.from("brand_assets").insert(
        acceptedAssets.map((a, i) => ({
          brand_id: brand.id,
          asset_type: a.asset_type,
          name_en: a.name_en,
          name_ar: a.name_ar,
          download_policy: "host",
          formats: ["svg", "png"],
          is_archived: false,
          sort_order: i,
        }))
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
