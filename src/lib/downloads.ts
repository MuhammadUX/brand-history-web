import { createServerSupabase } from "./supabase-server";

export interface DownloadItem {
  id: string;
  brandId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  initials: string;
  primaryColor: string;
  website: string | null;
  kind: string;
  createdAt: string;
}

/**
 * Recent downloads for the signed-in user (newest first), joined to brand
 * display fields. Empty for anonymous visitors. RLS restricts rows to the
 * current user.
 */
export async function getUserDownloads(limit = 60): Promise<DownloadItem[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("downloads")
    .select("id, brand_id, kind, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getUserDownloads error:", error.message);
    return [];
  }
  const list = rows ?? [];
  const ids = [...new Set(list.map((r) => r.brand_id as string))];
  if (ids.length === 0) return [];

  const { data: brands, error: bErr } = await supabase
    .from("brands")
    .select("id, slug, name_en, name_ar, initials, primary_color, website")
    .in("id", ids);
  if (bErr) {
    console.error("getUserDownloads brands error:", bErr.message);
    return [];
  }
  type BrandRow = {
    id: string;
    slug: string;
    name_en: string;
    name_ar: string;
    initials: string;
    primary_color: string;
    website: string | null;
  };
  const bmap = new Map(
    ((brands as unknown as BrandRow[]) ?? []).map((b) => [b.id, b])
  );

  return list
    .map((r): DownloadItem | null => {
      const b = bmap.get(r.brand_id as string);
      if (!b) return null;
      return {
        id: r.id as string,
        brandId: r.brand_id as string,
        slug: b.slug,
        nameEn: b.name_en,
        nameAr: b.name_ar,
        initials: b.initials,
        primaryColor: b.primary_color,
        website: b.website ?? null,
        kind: r.kind as string,
        createdAt: r.created_at as string,
      };
    })
    .filter((x): x is DownloadItem => x !== null);
}
