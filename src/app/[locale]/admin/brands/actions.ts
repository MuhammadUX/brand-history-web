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

async function bumpBrand(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  operator: Operator,
  brandId: string
) {
  await supabase
    .from("brands")
    .update({ updated_by: operator.id, last_updated_at: new Date().toISOString() })
    .eq("id", brandId);
}

export async function saveColor(
  brandId: string,
  colorId: string | null,
  fd: FormData
): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
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
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, colorId ? "update" : "create", "brand_color", brandId, payload);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteColor(brandId: string, colorId: string): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
    await supabase.from("brand_colors").delete().eq("id", colorId);
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, "delete", "brand_color", brandId, { colorId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function saveAsset(
  brandId: string,
  assetId: string | null,
  fd: FormData
): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
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
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, assetId ? "update" : "create", "brand_asset", brandId, {
      name_en: payload.name_en,
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteAsset(brandId: string, assetId: string): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
    await supabase.from("brand_assets").delete().eq("id", assetId);
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, "delete", "brand_asset", brandId, { assetId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function saveTimeline(
  brandId: string,
  entryId: string | null,
  fd: FormData
): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
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
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, entryId ? "update" : "create", "timeline_entry", brandId, {
      year: payload.year,
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteTimeline(brandId: string, entryId: string): Promise<{ ok: boolean }> {
  try {
    const { operator, supabase } = await operatorClient();
    await supabase.from("timeline_entries").delete().eq("id", entryId);
    await bumpBrand(supabase, operator, brandId);
    await writeAudit(supabase, operator, "delete", "timeline_entry", brandId, { entryId });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
