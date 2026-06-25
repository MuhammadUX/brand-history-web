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
  website?: string | null;
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
  designer_credit?: string | null;
  agency?: string | null;
  credit_source_url?: string | null;
  clear_space?: string | null;
  min_size?: string | null;
  voice_en?: string | null;
  voice_ar?: string | null;
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
  logo_url?: string | null;
  change_kind?: string | null;
  credit?: string | null;
  source_url?: string | null;
  sort_order: number;
}

export interface BrandFont {
  id: string;
  brand_id: string;
  family: string;
  role: string | null;
  specimen_en: string | null;
  specimen_ar: string | null;
  weights: string | null;
  policy: "host" | "link_out" | "specimen_only";
  license: string | null;
  foundry: string | null;
  source_url: string | null;
  css_stack: string | null;
  sort_order: number;
}

export interface BrandGuideline {
  id: string;
  brand_id: string;
  kind: "do" | "dont";
  text_en: string;
  text_ar: string | null;
  sort_order: number;
}

export interface BrandApplication {
  id: string;
  brand_id: string;
  context: string;
  image_url: string | null;
  caption_en: string | null;
  caption_ar: string | null;
  bg_color: string | null;
  sort_order: number;
}
