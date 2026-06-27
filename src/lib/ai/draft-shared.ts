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
  founded_year?: number | null;
  overview_en?: string;
  overview_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  field_confidence?: Record<string, number>;
  field_sources?: Record<string, string[]>;
  colors?: Array<{ name?: string; hex?: string; confidence?: number; source?: string }>;
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
  "founded_year": number|null,
  "overview_en": string, "overview_ar": string,
  "summary_en": string, "summary_ar": string,
  "field_confidence": { "overview": number, "summary": number, "sector": number, "founded_year": number },
  "field_sources": { "overview": string[], "summary": string[], "sector": string[], "founded_year": string[] },
  "colors": [ { "name": string, "hex": string, "confidence": number, "source": string } ],
  "assets": [ { "asset_type": string, "name_en": string, "name_ar": string, "confidence": number } ],
  "timeline": [ { "year": number, "title_en": string, "title_ar": string, "description_en": string, "description_ar": string, "change_kind": string, "confidence": number, "source": string } ]
}
Rules: sector_slug MUST be one of [${sectors.join(", ") || "none"}] or null. All confidence values are 0..1. hex like #RRGGBB. timeline change_kind MUST be one of: founding, logo, wordmark, color, refresh, rebrand, rename, identity; if you find no genuine identity events, return an empty timeline. If nothing can be verified, set found=false and leave text fields empty.`;
}

export function buildUserPrompt(input: DraftInput): string {
  const url = input.hints?.url?.trim();
  return `Brand name: ${input.name.trim()}
${url ? `Official website: ${url}` : "Official website: (not provided — find it)"}
${input.hints?.region ? `Region hint: ${input.hints.region}` : ""}

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
  const sector_slug =
    g.sector_slug && ctx.sectors.includes(g.sector_slug) ? g.sector_slug : null;

  const conf = g.field_confidence ?? {};
  const srcs = g.field_sources ?? {};

  const colors: DraftColor[] = (g.colors ?? [])
    .filter((c) => c && typeof c.hex === "string")
    .map((c) => ({
      name: c.name || "Color",
      hex: c.hex as string,
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
