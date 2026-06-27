"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  requireOperatorAction,
  slugify,
  writeAudit,
  type Operator,
  type PublicationState,
} from "@/lib/admin";

export interface ActionResult {
  ok: boolean;
  /** dictionary key under admin.editor for the message, or null */
  message?: "saved" | "conflict" | "saveError" | "transitionDone" | "forbidden";
  /** for "new" save: the created id so the client can navigate */
  id?: string;
  /** for publish validation failures */
  validation?: string[];
  /** new row_version after a successful save */
  rowVersion?: number;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function nullableStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}
function intOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

async function operatorClient() {
  const operator = await requireOperatorAction();
  const supabase = await createServerSupabase();
  return { operator, supabase };
}

/** Create a new brand draft. */
export async function createBrand(
  locale: string,
  _prev: ActionResult,
  fd: FormData
): Promise<ActionResult> {
  let operator: Operator;
  try {
    const ctx = await operatorClient();
    operator = ctx.operator;
    const supabase = ctx.supabase;

    const name_en = str(fd, "name_en");
    if (!name_en) return { ok: false, message: "saveError" };
    const slug = slugify(str(fd, "slug") || name_en);

    const payload = {
      name_en,
      name_ar: str(fd, "name_ar"),
      slug,
      sector_id: nullableStr(fd, "sector_id"),
      region: str(fd, "region") || "KSA",
      founded_year: intOrNull(fd, "founded_year"),
      summary_en: nullableStr(fd, "summary_en"),
      summary_ar: nullableStr(fd, "summary_ar"),
      primary_color: str(fd, "primary_color") || "#3B5BDB",
      initials: nullableStr(fd, "initials"),
      claim_status: (str(fd, "claim_status") || "unclaimed") as
        | "unclaimed"
        | "claimed"
        | "verified",
      publication_state: "draft" as PublicationState,
      created_by: operator.id,
      updated_by: operator.id,
      last_updated_at: new Date().toISOString(),
      row_version: 0,
    };

    const { data, error } = await supabase
      .from("brands")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      console.error("createBrand error:", error?.message);
      return { ok: false, message: "saveError" };
    }

    await writeAudit(supabase, operator, "create", "brand", data.id, {
      name_en,
      slug,
    });
    revalidatePath(`/${locale}/admin/brands`);
    return { ok: true, message: "saved", id: data.id };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

/** Update an existing brand with optimistic locking on row_version. */
export async function updateBrand(
  locale: string,
  id: string,
  _prev: ActionResult,
  fd: FormData
): Promise<ActionResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const expectedVersion = intOrNull(fd, "row_version") ?? 0;
    const name_en = str(fd, "name_en");
    if (!name_en) return { ok: false, message: "saveError" };

    const newVersion = expectedVersion + 1;
    const payload = {
      name_en,
      name_ar: str(fd, "name_ar"),
      slug: slugify(str(fd, "slug") || name_en),
      sector_id: nullableStr(fd, "sector_id"),
      region: str(fd, "region") || "KSA",
      founded_year: intOrNull(fd, "founded_year"),
      summary_en: nullableStr(fd, "summary_en"),
      summary_ar: nullableStr(fd, "summary_ar"),
      primary_color: str(fd, "primary_color") || "#3B5BDB",
      initials: nullableStr(fd, "initials"),
      claim_status: (str(fd, "claim_status") || "unclaimed") as
        | "unclaimed"
        | "claimed"
        | "verified",
      updated_by: operator.id,
      last_updated_at: new Date().toISOString(),
      row_version: newVersion,
    };

    const { data, error } = await supabase
      .from("brands")
      .update(payload)
      .eq("id", id)
      .eq("row_version", expectedVersion)
      .select("id");

    if (error) {
      console.error("updateBrand error:", error.message);
      return { ok: false, message: "saveError" };
    }
    if (!data || data.length === 0) {
      // 0 rows updated -> version mismatch (someone else changed it)
      return { ok: false, message: "conflict" };
    }

    await writeAudit(supabase, operator, "update", "brand", id, { name_en });
    revalidatePath(`/${locale}/admin/brands/${id}`);
    revalidatePath(`/${locale}/admin/brands`);
    return { ok: true, message: "saved", rowVersion: newVersion };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

/** Validation checklist for publishing. Returns list of failing message keys. */
async function publishValidation(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  id: string
): Promise<string[]> {
  const fails: string[] = [];
  const { data: brand } = await supabase
    .from("brands")
    .select("name_en,name_ar")
    .eq("id", id)
    .maybeSingle();
  if (!brand?.name_en?.trim()) fails.push("vNameEn");
  if (!brand?.name_ar?.trim()) fails.push("vNameAr");

  const { count: assetCount } = await supabase
    .from("brand_assets")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id)
    .eq("is_archived", false);
  if (!assetCount || assetCount < 1) fails.push("vAsset");

  const { count: colorCount } = await supabase
    .from("brand_colors")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id);
  if (!colorCount || colorCount < 1) fails.push("vColor");

  return fails;
}

const TRANSITIONS: Record<
  string,
  { from: PublicationState[]; to: PublicationState; adminOnly: boolean }
> = {
  submit: { from: ["draft"], to: "in_review", adminOnly: false },
  approve: { from: ["in_review"], to: "approved", adminOnly: true },
  publish: { from: ["approved", "unpublished"], to: "published", adminOnly: true },
  unpublish: { from: ["published"], to: "unpublished", adminOnly: false },
};

/** Publication state-machine transition with role gating, validation, audit. */
export async function transitionBrand(
  locale: string,
  id: string,
  action: keyof typeof TRANSITIONS,
  expectedVersion: number
): Promise<ActionResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const t = TRANSITIONS[action];
    if (!t) return { ok: false, message: "saveError" };
    if (t.adminOnly && operator.role !== "admin") {
      return { ok: false, message: "forbidden" };
    }

    const { data: brand } = await supabase
      .from("brands")
      .select("publication_state,row_version")
      .eq("id", id)
      .maybeSingle();
    if (!brand) return { ok: false, message: "saveError" };
    if (!t.from.includes(brand.publication_state as PublicationState)) {
      return { ok: false, message: "saveError" };
    }

    if (action === "publish") {
      const fails = await publishValidation(supabase, id);
      if (fails.length > 0) {
        return { ok: false, validation: fails };
      }
    }

    const newVersion = (brand.row_version ?? 0) + 1;
    const { data, error } = await supabase
      .from("brands")
      .update({
        publication_state: t.to,
        updated_by: operator.id,
        last_updated_at: new Date().toISOString(),
        row_version: newVersion,
      })
      .eq("id", id)
      .eq("row_version", brand.row_version ?? 0)
      .select("id");

    if (error) {
      console.error("transitionBrand error:", error.message);
      return { ok: false, message: "saveError" };
    }
    if (!data || data.length === 0) return { ok: false, message: "conflict" };

    await writeAudit(supabase, operator, action, "brand", id, {
      from: brand.publication_state,
      to: t.to,
    });
    revalidatePath(`/${locale}/admin/brands/${id}`);
    revalidatePath(`/${locale}/admin/brands`);
    revalidatePath(`/${locale}/admin`);
    return { ok: true, message: "transitionDone", rowVersion: newVersion };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

/* ---------------- child collection actions (colors / assets / timeline) ---------------- */

/** Result of a child-collection mutation (colors / assets / timeline). */
export interface ChildResult {
  ok: boolean;
  /** dictionary key under admin.editor for a user-facing error, when ok=false */
  message?: "childPublished" | "saveError" | "forbidden";
}

/** States in which a brand's children may be edited directly. */
const EDITABLE_CHILD_STATES: PublicationState[] = [
  "draft",
  "in_review",
  "approved",
  "unpublished",
];

/**
 * State gate: a published brand's children must NOT be edited directly (it would
 * mutate the public surface with no review). Returns the brand's current
 * row_version on success, or null if the brand is published / missing.
 */
async function loadEditableBrand(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  brandId: string
): Promise<{ ok: true; rowVersion: number } | { ok: false; reason: "childPublished" | "saveError" }> {
  const { data: brand, error } = await supabase
    .from("brands")
    .select("publication_state,row_version")
    .eq("id", brandId)
    .maybeSingle();
  if (error || !brand) return { ok: false, reason: "saveError" };
  if (!EDITABLE_CHILD_STATES.includes(brand.publication_state as PublicationState)) {
    return { ok: false, reason: "childPublished" };
  }
  return { ok: true, rowVersion: brand.row_version ?? 0 };
}

/**
 * Bump the parent brand after a child mutation: increment row_version (so
 * parent stale-detection stays correct), refresh last_updated_at and updated_by.
 */
async function bumpBrand(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  operator: Operator,
  brandId: string,
  currentVersion: number
) {
  await supabase
    .from("brands")
    .update({
      updated_by: operator.id,
      last_updated_at: new Date().toISOString(),
      row_version: currentVersion + 1,
    })
    .eq("id", brandId);
}

export async function saveColor(
  brandId: string,
  colorId: string | null,
  fd: FormData
): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    const payload = {
      brand_id: brandId,
      name: str(fd, "name") || "Color",
      hex: str(fd, "hex") || "#000000",
      role: str(fd, "role") || "primary",
      sort_order: intOrNull(fd, "sort_order") ?? 0,
    };
    if (colorId) {
      await supabase.from("brand_colors").update(payload).eq("id", colorId);
    } else {
      await supabase.from("brand_colors").insert(payload);
    }
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, colorId ? "color_updated" : "color_added", "brand", brandId, {
      color_id: colorId,
      ...payload,
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export async function deleteColor(brandId: string, colorId: string): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    await supabase.from("brand_colors").delete().eq("id", colorId);
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, "color_removed", "brand", brandId, { color_id: colorId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export async function saveAsset(
  brandId: string,
  assetId: string | null,
  fd: FormData
): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    const formats = str(fd, "formats")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const payload = {
      brand_id: brandId,
      asset_type: str(fd, "asset_type") || "logo_primary",
      name_en: str(fd, "name_en") || "Asset",
      name_ar: str(fd, "name_ar") || "",
      download_policy: str(fd, "download_policy") || "host",
      formats: formats.length ? formats : ["svg", "png"],
      is_archived: fd.get("is_archived") === "on" || fd.get("is_archived") === "true",
      sort_order: intOrNull(fd, "sort_order") ?? 0,
    };
    if (assetId) {
      await supabase.from("brand_assets").update(payload).eq("id", assetId);
    } else {
      await supabase.from("brand_assets").insert(payload);
    }
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, assetId ? "asset_updated" : "asset_added", "brand", brandId, {
      asset_id: assetId,
      name_en: payload.name_en,
      asset_type: payload.asset_type,
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export async function deleteAsset(brandId: string, assetId: string): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    await supabase.from("brand_assets").delete().eq("id", assetId);
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, "asset_removed", "brand", brandId, { asset_id: assetId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export async function saveTimeline(
  brandId: string,
  entryId: string | null,
  fd: FormData
): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    const payload = {
      brand_id: brandId,
      year: intOrNull(fd, "year") ?? new Date().getFullYear(),
      title_en: str(fd, "title_en") || "Untitled",
      title_ar: str(fd, "title_ar") || "",
      description_en: nullableStr(fd, "description_en"),
      description_ar: nullableStr(fd, "description_ar"),
      category: str(fd, "category") || "identity_update",
      sort_order: intOrNull(fd, "sort_order") ?? 0,
    };
    if (entryId) {
      await supabase.from("timeline_entries").update(payload).eq("id", entryId);
    } else {
      await supabase.from("timeline_entries").insert(payload);
    }
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, entryId ? "timeline_updated" : "timeline_added", "brand", brandId, {
      entry_id: entryId,
      year: payload.year,
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export async function deleteTimeline(brandId: string, entryId: string): Promise<ChildResult> {
  try {
    const { operator, supabase } = await operatorClient();
    const gate = await loadEditableBrand(supabase, brandId);
    if (!gate.ok) return { ok: false, message: gate.reason };
    await supabase.from("timeline_entries").delete().eq("id", entryId);
    await bumpBrand(supabase, operator, brandId, gate.rowVersion);
    await writeAudit(supabase, operator, "timeline_removed", "brand", brandId, { entry_id: entryId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "forbidden" };
  }
}

export interface DeleteBrandResult {
  ok: boolean;
  message?: "forbidden" | "notDraft" | "notFound" | "error";
}

/**
 * Delete a brand — restricted to ADMINS and to brands still in `draft` state
 * (published / in-review / archived brands must be archived, not hard-deleted).
 * Removes child rows first, then the brand. Used to clean up bad AI-builder
 * drafts.
 */
export async function deleteDraftBrand(
  brandId: string
): Promise<DeleteBrandResult> {
  try {
    const { operator, supabase } = await operatorClient();
    if (operator.role !== "admin") return { ok: false, message: "forbidden" };

    const { data: brand } = await supabase
      .from("brands")
      .select("id, name_en, publication_state")
      .eq("id", brandId)
      .maybeSingle();
    if (!brand) return { ok: false, message: "notFound" };
    if (brand.publication_state !== "draft") {
      return { ok: false, message: "notDraft" };
    }

    // Remove children explicitly (don't rely on cascade), then the brand.
    await supabase.from("brand_colors").delete().eq("brand_id", brandId);
    await supabase.from("brand_assets").delete().eq("brand_id", brandId);
    await supabase.from("timeline_entries").delete().eq("brand_id", brandId);
    await supabase.from("favorites").delete().eq("brand_id", brandId);
    await supabase.from("downloads").delete().eq("brand_id", brandId);

    const { error } = await supabase.from("brands").delete().eq("id", brandId);
    if (error) {
      console.error("deleteDraftBrand error:", error.message);
      return { ok: false, message: "error" };
    }

    await writeAudit(supabase, operator, "brand_deleted", "brand", brandId, {
      name_en: brand.name_en,
    });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("deleteDraftBrand exception:", e);
    return { ok: false, message: "forbidden" };
  }
}
