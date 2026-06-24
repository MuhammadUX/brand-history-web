export type Locale = "en" | "ar";

export type ClaimStatus = "unclaimed" | "claimed" | "verified";
export type AssetType =
  | "logo_primary"
  | "secondary"
  | "icon"
  | "wordmark"
  | "monochrome";
export type DownloadPolicy = "host" | "link_out" | "pro";

export interface Sector {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
}

export interface Brand {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sector_id: string | null;
  region: string | null;
  founded_year: number | null;
  summary_en: string | null;
  summary_ar: string | null;
  primary_color: string;
  initials: string;
  claim_status: ClaimStatus;
  publication_state: string;
  is_verified: boolean;
  download_count: number;
  last_updated_at: string | null;
  created_at: string | null;
  sectors?: Sector | null;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: AssetType;
  name_en: string;
  name_ar: string;
  download_policy: DownloadPolicy;
  formats: string[] | null;
  is_archived: boolean;
  era: string | null;
  sort_order: number;
}

export interface BrandColor {
  id: string;
  brand_id: string;
  name: string;
  hex: string;
  role: string;
  sort_order: number;
}

export interface TimelineEntry {
  id: string;
  brand_id: string;
  year: number;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  category: string | null;
  sort_order: number;
}
