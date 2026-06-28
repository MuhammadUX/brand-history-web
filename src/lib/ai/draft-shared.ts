/**
 * Shared drafting helpers used by every real LLM provider (Gemini, Claude, …):
 * the system/user prompts, the JSON contract parser, and the mapper that turns
 * the model's JSON into our BrandDraft + fields_meta. Keeping this in one place
 * means all providers return identical, comparable drafts.
 */

import {
  BRAND_HISTORY_GUIDANCE,
  type DraftInput,
  type DraftResult,
  type BrandDraft,
  type DraftColor,
  type ProposedSector,
  type DraftAsset,
  type DraftTimelineEntry,
  type FieldMeta,
  type ConfidenceBand,
} from "./llm-provider";
import { createServerSupabase } from "@/lib/supabase-server";

export function band(c: number): ConfidenceBand {
  if (c >= 0.8) return "H";
  if (c >= 0.55) return "M";
  return "L";
}

export function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/** The JSON shape we ask every model to return (kept simple to parse). */
export interface RawBrand {
  found?: boolean;
  sector_slug?: string | null;
  /** A new sector the model proposes when nothing in the allowed list fits. */
  sector_new?: { slug?: string; name_en?: string; name_ar?: string } | null;
  founded_year?: number | null;
  overview_en?: string;
  overview_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  field_confidence?: Record<string, number>;
  field_sources?: Record<string, string[]>;
  colors?: Array<{
    name?: string;
    hex?: string;
    role?: string;
    confidence?: number;
    source?: string;
  }>;
  assets?: Array<{
    asset_type?: string;
    name_en?: string;
    name_ar?: string;
    confidence?: number;
  }>;
  timeline?: Array<{
    year?: number;
    title_en?: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    change_kind?: string;
    confidence?: number;
    source?: string;
  }>;
}

const COLOR_ROLES = new Set(["primary", "secondary", "neutral", "accent"]);

/** Map a model-supplied color role onto our allowed set; undefined if unknown. */
function normalizeRole(role: unknown): string | undefined {
  if (typeof role !== "string") return undefined;
  const r = role.trim().toLowerCase();
  return COLOR_ROLES.has(r) ? r : undefined;
}

const IDENTITY_KINDS = new Set([
  "founding",
  "logo",
  "wordmark",
  "color",
  "refresh",
  "rebrand",
  "rename",
  "identity",
]);

export function buildSystemPrompt(sectors: string[]): string {
  return `${BRAND_HISTORY_GUIDANCE}

You are a brand-identity researcher for a bilingual (English + Arabic) brand archive. Research the brand below using its official website and web search. Be accurate and never invent facts: if you cannot verify something, lower its confidence or omit it. Write Arabic fields in clear Modern Standard Arabic.

Return ONLY a single JSON object (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "found": boolean,
  "sector_slug": string|null,
  "sector_new": { "slug": string, "name_en": string, "name_ar": string } | null,
  "founded_year": number|null,
  "overview_en": string, "overview_ar": string,
  "summary_en": string, "summary_ar": string,
  "field_confidence": { "overview": number, "summary": number, "sector": number, "founded_year": number },
  "field_sources": { "overview": string[], "summary": string[], "sector": string[], "founded_year": string[] },
  "colors": [ { "name": string, "hex": string, "role": string, "confidence": number, "source": string } ],
  "assets": [ { "asset_type": string, "name_en": string, "name_ar": string, "confidence": number } ],
  "timeline": [ { "year": number, "title_en": string, "title_ar": string, "description_en": string, "description_ar": string, "change_kind": string, "confidence": number, "source": string } ]
}
Rules:
- Sector: pick the brand's best-fitting sector. PREFER a slug from this allowed list: [${sectors.join(", ") || "none"}]. If one fits, set sector_slug to it and set sector_new to null. If NOTHING in the list fits, set sector_slug to null AND propose sector_new = { slug (lowercase, hyphenated, e.g. "real-estate"), name_en, name_ar }. Never both — when sector_slug is set, sector_new must be null.
- Colors: Enumerate EVERY swatch in the brand's palette individually (all primaries AND all secondaries/neutrals/accents) — do not return only the main color. For each color provide its name, role (one of: primary, secondary, neutral, accent), and exact hex. If a brand-guidelines URL is given, READ it fully and list ALL named colors in it. NEVER invent a hex; if you are unsure of an exact value, lower that color's confidence.
- Sources: every source/field_sources value MUST be a short bare domain only (e.g. "stc.com", "wikipedia.org") — NEVER a full URL, query string, or search/redirect link. Keep the whole JSON compact.
- All confidence values are 0..1. hex like #RRGGBB.
- timeline change_kind MUST be one of: founding, logo, wordmark, color, refresh, rebrand, rename, identity; if you find no genuine identity events, return an empty timeline.
- If nothing can be verified, set found=false and leave text fields empty.`;
}

export function buildUserPrompt(input: DraftInput): string {
  const url = input.hints?.url?.trim();
  const guidelines = input.hints?.guidelines_url?.trim();
  return `Brand name: ${input.name.trim()}
${url ? `Official website: ${url}` : "Official website: (not provided — find it)"}
${input.hints?.region ? `Region hint: ${input.hints.region}` : ""}
${guidelines ? `Brand-guidelines URL (read this PDF for the full color palette): ${guidelines}` : ""}

Research this brand's visual identity and return the JSON.`;
}

/** Pull a JSON object out of model text, tolerating stray fences/prose. */
export function extractJson(text: string): RawBrand | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(cleaned) as RawBrand;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as RawBrand;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function buildDraft(
  g: RawBrand,
  ctx: { url: string | null; sectors: string[] }
): DraftResult {
  const siteDomain = ctx.url
    ? ctx.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    : "";

  const found = g.found !== false;
  // If the model's slug is in the allowed list, use it. Otherwise DON'T silently
  // drop it — surface it as a proposed new sector so the operator can create it.
  const slugInList =
    !!g.sector_slug && ctx.sectors.includes(g.sector_slug);
  const sector_slug = slugInList ? (g.sector_slug as string) : null;

  let sector_new: ProposedSector | null = null;
  if (!slugInList) {
    // Prefer an explicit sector_new from the model; otherwise synthesize one
    // from the non-listed slug it returned.
    const proposedSlug = (g.sector_new?.slug || g.sector_slug || "").trim();
    if (proposedSlug) {
      sector_new = {
        slug: proposedSlug,
        name_en: (g.sector_new?.name_en || proposedSlug).trim(),
        name_ar: (g.sector_new?.name_ar || g.sector_new?.name_en || proposedSlug).trim(),
      };
    }
  }

  const conf = g.field_confidence ?? {};
  const srcs = g.field_sources ?? {};

  const colors: DraftColor[] = (g.colors ?? [])
    .filter((c) => c && typeof c.hex === "string")
    .map((c) => ({
      name: c.name || "Color",
      hex: c.hex as string,
      role: normalizeRole(c.role),
      confidence: clamp01(c.confidence),
      source: c.source || "",
    }));

  const assets: DraftAsset[] = (g.assets ?? [])
    .filter((a) => a && (a.name_en || a.asset_type))
    .map((a) => ({
      asset_type: a.asset_type || "logo_primary",
      name_en: a.name_en || "Logo",
      name_ar: a.name_ar || "شعار",
      confidence: clamp01(a.confidence),
    }));

  const timeline: DraftTimelineEntry[] = (g.timeline ?? [])
    .filter(
      (t) =>
        t &&
        typeof t.year === "number" &&
        (!t.change_kind || IDENTITY_KINDS.has(t.change_kind))
    )
    .map((t) => ({
      year: t.year as number,
      title_en: t.title_en || "",
      title_ar: t.title_ar || "",
      description_en: t.description_en || "",
      description_ar: t.description_ar || "",
      change_kind:
        (t.change_kind as DraftTimelineEntry["change_kind"]) || "identity",
      confidence: clamp01(t.confidence),
      source: t.source || "",
    }));

  const fields_meta: Record<string, FieldMeta> = {};
  const metaFor = (key: string, fallbackSource?: string) => {
    const c = clamp01(conf[key]);
    const sources = (srcs[key] ?? []).filter(Boolean).map((d) => ({ domain: d }));
    if (sources.length === 0 && fallbackSource) sources.push({ domain: fallbackSource });
    fields_meta[key] = { origin: "ai", confidence: c, band: band(c), sources };
  };
  metaFor("overview", siteDomain || undefined);
  metaFor("summary");
  metaFor("sector");
  metaFor("founded_year");

  colors.forEach((col, i) => {
    fields_meta[`color:${i}`] = {
      origin: "ai",
      confidence: col.confidence,
      band: band(col.confidence),
      sources: col.source ? [{ domain: col.source }] : [],
    };
  });
  assets.forEach((a, i) => {
    fields_meta[`asset:${i}`] = {
      origin: "ai",
      confidence: a.confidence,
      band: band(a.confidence),
      sources: a.confidence >= 0.55 && siteDomain ? [{ domain: siteDomain }] : [],
    };
  });
  timeline.forEach((tl, i) => {
    fields_meta[`timeline:${i}`] = {
      origin: "ai",
      confidence: tl.confidence,
      band: band(tl.confidence),
      sources: tl.source ? [{ domain: tl.source }] : [],
    };
  });

  const hasText = !!(g.overview_en || g.overview_ar || g.summary_en);
  const richCount = colors.length + assets.length + timeline.length;
  const noFindings = !found || (!hasText && richCount === 0);

  const draft: BrandDraft = {
    overview_en: g.overview_en || "",
    overview_ar: g.overview_ar || "",
    sector_slug,
    sector_new,
    founded_year: typeof g.founded_year === "number" ? g.founded_year : null,
    summary_en: g.summary_en || "",
    summary_ar: g.summary_ar || "",
    colors,
    assets,
    timeline,
    fields_meta,
    no_findings: noFindings || undefined,
  };

  const findings: DraftResult["findings"] = noFindings
    ? "none"
    : hasText && richCount >= 4
      ? "rich"
      : "sparse";

  return { draft, findings };
}

export async function fetchSectorSlugs(): Promise<string[]> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("sectors").select("slug");
    return (data ?? [])
      .map((r) => (r as { slug?: string }).slug)
      .filter((s): s is string => !!s);
  } catch {
    return [];
  }
}
