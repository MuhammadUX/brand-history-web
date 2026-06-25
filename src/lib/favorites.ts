import { createServerSupabase } from "./supabase-server";
import type { Brand } from "./types";

const BRAND_SELECT =
  "id,slug,name_en,name_ar,sector_id,website,region,founded_year,summary_en,summary_ar,primary_color,initials,claim_status,publication_state,is_verified,download_count,last_updated_at,created_at,sectors(id,slug,name_en,name_ar,sort_order)";

/**
 * Returns { isAuthed, favoriteIds } in a single auth read — convenient for
 * pages that render BrandGrid for both anonymous and signed-in visitors.
 */
export async function getFavoritesContext(): Promise<{
  isAuthed: boolean;
  favoriteIds: string[];
}> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAuthed: false, favoriteIds: [] };
  const { data, error } = await supabase
    .from("favorites")
    .select("brand_id")
    .eq("user_id", user.id);
  if (error) {
    console.error("getFavoritesContext error:", error.message);
    return { isAuthed: true, favoriteIds: [] };
  }
  return {
    isAuthed: true,
    favoriteIds: (data ?? []).map((r) => r.brand_id as string),
  };
}

/**
 * Returns the brand IDs the signed-in user has favorited. Empty if anonymous.
 */
export async function getFavoriteBrandIds(): Promise<string[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("brand_id")
    .eq("user_id", user.id);
  if (error) {
    console.error("getFavoriteBrandIds error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.brand_id as string);
}

/**
 * Returns the full Brand rows the signed-in user has favorited (newest first).
 */
export async function getFavoriteBrands(): Promise<Brand[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: favs, error: favErr } = await supabase
    .from("favorites")
    .select("brand_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (favErr) {
    console.error("getFavoriteBrands favorites error:", favErr.message);
    return [];
  }
  const ids = (favs ?? []).map((r) => r.brand_id as string);
  if (ids.length === 0) return [];

  const { data: brands, error: brandErr } = await supabase
    .from("brands")
    .select(BRAND_SELECT)
    .in("id", ids);
  if (brandErr) {
    console.error("getFavoriteBrands brands error:", brandErr.message);
    return [];
  }
  // Preserve favorite ordering (newest first).
  const order = new Map(ids.map((id, i) => [id, i]));
  return ((brands as unknown as Brand[]) ?? []).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}
