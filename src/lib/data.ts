import { getSupabaseServerClient } from "./supabase";
import type {
  Brand,
  BrandAsset,
  BrandColor,
  BrandFont,
  BrandGuideline,
  BrandApplication,
  Sector,
  TimelineEntry,
} from "./types";

const BRAND_SELECT =
  "id,slug,name_en,name_ar,sector_id,website,region,founded_year,summary_en,summary_ar,primary_color,initials,claim_status,publication_state,is_verified,download_count,last_updated_at,created_at,designer_credit,agency,credit_source_url,clear_space,min_size,voice_en,voice_ar,sectors(id,slug,name_en,name_ar,sort_order)";

export async function getSectors(): Promise<Sector[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("sectors")
    .select("id,slug,name_en,name_ar,sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getSectors error:", error.message);
    return [];
  }
  return (data as Sector[]) ?? [];
}

async function sectorIdForSlug(slug: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("sectors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getBrands(sectorSlug?: string): Promise<Brand[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("brands")
    .select(BRAND_SELECT)
    .order("download_count", { ascending: false });
  if (sectorSlug) {
    const sectorId = await sectorIdForSlug(sectorSlug);
    if (!sectorId) return [];
    query = query.eq("sector_id", sectorId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("getBrands error:", error.message);
    return [];
  }
  return (data as unknown as Brand[]) ?? [];
}

export async function searchBrands(
  q: string,
  sectorSlug?: string
): Promise<Brand[]> {
  const term = q.trim();
  if (!term) return [];
  const supabase = getSupabaseServerClient();
  const like = `%${term}%`;
  let query = supabase
    .from("brands")
    .select(BRAND_SELECT)
    .or(`name_en.ilike.${like},name_ar.ilike.${like}`)
    .order("download_count", { ascending: false });
  if (sectorSlug) {
    const sectorId = await sectorIdForSlug(sectorSlug);
    if (!sectorId) return [];
    query = query.eq("sector_id", sectorId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("searchBrands error:", error.message);
    return [];
  }
  return (data as unknown as Brand[]) ?? [];
}

export async function getTrendingBrands(limit = 8): Promise<Brand[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .order("download_count", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getTrendingBrands error:", error.message);
    return [];
  }
  return (data as unknown as Brand[]) ?? [];
}

export async function getRecentlyUpdatedBrands(limit = 8): Promise<Brand[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .order("last_updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getRecentlyUpdatedBrands error:", error.message);
    return [];
  }
  return (data as unknown as Brand[]) ?? [];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getBrandBySlug error:", error.message);
    return null;
  }
  return (data as unknown as Brand) ?? null;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getBrandById error:", error.message);
    return null;
  }
  return (data as unknown as Brand) ?? null;
}

const ASSET_SELECT =
  "id,brand_id,asset_type,name_en,name_ar,download_policy,formats,is_archived,era,sort_order";

export async function getBrandAssets(brandId: string): Promise<BrandAsset[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_assets")
    .select(ASSET_SELECT)
    .eq("brand_id", brandId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getBrandAssets error:", error.message);
    return [];
  }
  return (data as BrandAsset[]) ?? [];
}

export async function getArchivedAssets(brandId: string): Promise<BrandAsset[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_assets")
    .select(ASSET_SELECT)
    .eq("brand_id", brandId)
    .eq("is_archived", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getArchivedAssets error:", error.message);
    return [];
  }
  return (data as BrandAsset[]) ?? [];
}

export async function getBrandColors(brandId: string): Promise<BrandColor[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_colors")
    .select("id,brand_id,name,hex,role,sort_order")
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getBrandColors error:", error.message);
    return [];
  }
  return (data as BrandColor[]) ?? [];
}

export async function getTimeline(brandId: string): Promise<TimelineEntry[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("timeline_entries")
    .select(
      "id,brand_id,year,title_en,title_ar,description_en,description_ar,category,logo_url,change_kind,credit,source_url,sort_order"
    )
    .eq("brand_id", brandId)
    .order("year", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getTimeline error:", error.message);
    return [];
  }
  return (data as TimelineEntry[]) ?? [];
}

export async function getBrandFonts(brandId: string): Promise<BrandFont[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_fonts")
    .select(
      "id,brand_id,family,role,specimen_en,specimen_ar,weights,policy,license,foundry,source_url,css_stack,sort_order"
    )
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getBrandFonts error:", error.message);
    return [];
  }
  return (data as BrandFont[]) ?? [];
}

export async function getBrandGuidelines(
  brandId: string
): Promise<BrandGuideline[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_guidelines")
    .select("id,brand_id,kind,text_en,text_ar,sort_order")
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getBrandGuidelines error:", error.message);
    return [];
  }
  return (data as BrandGuideline[]) ?? [];
}

export async function getBrandApplications(
  brandId: string
): Promise<BrandApplication[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_applications")
    .select(
      "id,brand_id,context,image_url,caption_en,caption_ar,bg_color,sort_order"
    )
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getBrandApplications error:", error.message);
    return [];
  }
  return (data as BrandApplication[]) ?? [];
}
