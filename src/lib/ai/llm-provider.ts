// LlmProvider — clean interface behind which a real Claude/GPT/Gemini impl can
// be swapped. Sprint 4 ships ONLY a deterministic dev STUB; no network is ever
// called. All "AI" wording, confidence and source data stays in the back-office;
// the public site must never surface any of it.

export type ConfidenceBand = "H" | "M" | "L";

export interface FieldSource {
  domain: string;
}

export interface FieldMeta {
  origin: "ai";
  /** 0..1 model self-reported confidence */
  confidence: number;
  band: ConfidenceBand;
  sources: FieldSource[];
  conflict?: boolean;
}

export interface DraftColor {
  name: string;
  hex: string;
  confidence: number;
  source: string;
}

export interface DraftAsset {
  asset_type: string;
  name_en: string;
  name_ar: string;
  confidence: number;
}

export interface DraftTimelineEntry {
  year: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  /**
   * The identity change this entry represents — BRAND history only. One of:
   * founding | logo | wordmark | color | refresh | rebrand | rename | identity.
   */
  change_kind?:
    | "founding"
    | "logo"
    | "wordmark"
    | "color"
    | "refresh"
    | "rebrand"
    | "rename"
    | "identity";
  confidence: number;
  source: string;
}

/** Structured AI output stored in profile_builder_runs.draft (jsonb). */
export interface BrandDraft {
  overview_en: string;
  overview_ar: string;
  sector_slug: string | null;
  founded_year: number | null;
  summary_en: string;
  summary_ar: string;
  colors: DraftColor[];
  assets: DraftAsset[];
  timeline: DraftTimelineEntry[];
  /** Per-field provenance/confidence used to drive gating in the review UI. */
  fields_meta: Record<string, FieldMeta>;
  /**
   * Set by startRun when the provider reported `findings: "none"` — an
   * empty/low draft. The review screen surfaces a "found little — build
   * manually" notice; the run still goes to draft_ready for operator review.
   */
  no_findings?: boolean;
}

export interface DraftInput {
  name: string;
  hints?: {
    sector_slug?: string | null;
    region?: string | null;
    url?: string | null;
  };
  languages?: string[];
}

export interface DraftResult {
  draft: BrandDraft;
  /** crude signal for the "low/no findings" gathering branch */
  findings: "rich" | "sparse" | "none";
}

export interface LlmProvider {
  draftBrandProfile(input: DraftInput): Promise<DraftResult>;
}

/* -------------------------------------------------------------------------- */
/*  Brand-history scope contract (system prompt for any real provider)        */
/* -------------------------------------------------------------------------- */

/**
 * BRAND_HISTORY_GUIDANCE — the scope contract a real LLM provider MUST be given
 * as a system instruction. "Brand History" documents a brand's VISUAL IDENTITY
 * over time — NOT the company's corporate history. Mixing in company milestones
 * (e.g. a Tadawul listing) is the exact failure this guards against.
 *
 * When wiring a real Claude/GPT/Gemini provider, prepend this to the timeline
 * gathering prompt and post-filter any returned entry whose `change_kind` is not
 * one of the identity kinds below.
 */
export const BRAND_HISTORY_GUIDANCE = `You are assembling the BRAND-IDENTITY history of a brand — NOT the company history.

INCLUDE only visual-identity events:
- Logo / symbol / wordmark changes
- Color-palette or typography-system changes
- Full rebrands or visual-identity refreshes
- Name changes that change the wordmark
- Major livery / packaging / identity-system reveals

EXCLUDE all company/corporate history (never add these):
- Corporate finance: IPOs, stock listings (e.g. Tadawul), share/secondary offerings, valuations, dividends
- Mergers, acquisitions, ownership or stake changes
- Leadership/board changes, earnings, revenue, contracts, partnerships
- Product launches and operational milestones (first flight, first store, first oil, route launches, market expansion)
- The founding ONLY counts insofar as it marks the brand's ORIGINAL logo/identity — not as a corporate-formation event.

For every event set change_kind to exactly one of:
founding | logo | wordmark | color | refresh | rebrand | rename | identity.
If no genuine identity event can be sourced, return an EMPTY timeline — never pad it with company milestones.`;

/* -------------------------------------------------------------------------- */
/*  Deterministic dev stub                                                    */
/* -------------------------------------------------------------------------- */

// Small deterministic hash so the same name always yields the same mock draft.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SECTORS = [
  "banking",
  "telecom",
  "retail",
  "energy",
  "aviation",
  "hospitality",
  "technology",
  "food",
];

const COLOR_PALETTES: { name: string; hex: string }[][] = [
  [
    { name: "Brand Blue", hex: "#1D4ED8" },
    { name: "Slate", hex: "#334155" },
    { name: "Accent Gold", hex: "#D4A017" },
  ],
  [
    { name: "Emerald", hex: "#047857" },
    { name: "Sand", hex: "#E7DCC3" },
    { name: "Ink", hex: "#0F172A" },
  ],
  [
    { name: "Crimson", hex: "#B91C1C" },
    { name: "Graphite", hex: "#1F2937" },
    { name: "Sky", hex: "#0EA5E9" },
  ],
  [
    { name: "Royal Purple", hex: "#6D28D9" },
    { name: "Mist", hex: "#CBD5E1" },
    { name: "Amber", hex: "#F59E0B" },
  ],
];

function band(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return "H";
  if (confidence >= 0.55) return "M";
  return "L";
}

/**
 * DevStubLlmProvider — returns a plausible MOCK structured draft, deterministic
 * from the input name. It deliberately marks ~1/4 of fields Low and/or
 * unsourced so the server-enforced high-confidence gating is demonstrable.
 * NEVER performs any network I/O.
 */
export class DevStubLlmProvider implements LlmProvider {
  async draftBrandProfile(input: DraftInput): Promise<DraftResult> {
    const name = input.name.trim();
    const h = hash(name.toLowerCase());

    // "no findings" branch: a name that hashes to a specific bucket, or empty.
    if (!name || h % 17 === 0) {
      const empty: BrandDraft = {
        overview_en: "",
        overview_ar: "",
        sector_slug: input.hints?.sector_slug ?? null,
        founded_year: null,
        summary_en: "",
        summary_ar: "",
        colors: [],
        assets: [],
        timeline: [],
        fields_meta: {},
      };
      return { draft: empty, findings: "none" };
    }

    const sector_slug = input.hints?.sector_slug || SECTORS[h % SECTORS.length];
    const founded_year = 1960 + (h % 60);
    const palette = COLOR_PALETTES[h % COLOR_PALETTES.length];
    const url = input.hints?.url?.trim();
    const siteDomain = url
      ? url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      : "company website";

    // Confidence varies by name so ~1/4 of fields land Low/unsourced.
    const c = (seed: number) => {
      const v = ((h >> seed) % 100) / 100; // 0..0.99
      return Math.round((0.45 + v * 0.5) * 100) / 100; // 0.45..0.95
    };

    const overviewConf = c(1);
    const summaryConf = c(2);
    const sectorConf = input.hints?.sector_slug ? 0.95 : c(3);
    const foundedConf = c(4);

    const colors: DraftColor[] = palette.map((p, i) => {
      const conf = i === palette.length - 1 ? c(5 + i) * 0.6 : c(5 + i); // last often Low
      const sourced = conf >= 0.55;
      return {
        name: p.name,
        hex: p.hex,
        confidence: Math.round(conf * 100) / 100,
        source: sourced ? (i === 0 ? siteDomain : "wikipedia.org") : "",
      };
    });

    const assets: DraftAsset[] = [
      {
        asset_type: "logo_primary",
        name_en: "Primary logo",
        name_ar: "الشعار الأساسي",
        confidence: c(9),
      },
      {
        asset_type: "wordmark",
        name_en: "Wordmark",
        name_ar: "الشعار النصي",
        confidence: Math.round(c(10) * 0.55 * 100) / 100, // often Low
      },
    ];

    // Identity events ONLY (see BRAND_HISTORY_GUIDANCE) — never company/finance.
    const timeline: DraftTimelineEntry[] = [
      {
        year: founded_year,
        title_en: "Original identity",
        title_ar: "الهوية الأصلية",
        description_en: name + "'s original logo and wordmark.",
        description_ar: "الشعار والاسم الأصلي لـ" + name + ".",
        change_kind: "founding",
        confidence: foundedConf,
        source: "wikipedia.org",
      },
      {
        year: founded_year + 20,
        title_en: "Brand refresh",
        title_ar: "تحديث الهوية",
        description_en: "A visual identity update — refreshed logo and colors.",
        description_ar: "تحديث للهوية البصرية — الشعار والألوان.",
        change_kind: "refresh",
        confidence: Math.round(c(11) * 0.6 * 100) / 100, // often Low/unsourced
        source: c(11) >= 0.55 ? siteDomain : "",
      },
    ];

    const overview_en =
      name +
      " is a " +
      sector_slug +
      " brand. This is a drafted overview generated for operator review; verify details before publishing.";
    const overview_ar =
      name +
      " علامة تجارية في قطاع " +
      sector_slug +
      ". هذه نظرة عامة مُسوّدة للمراجعة قبل النشر.";
    const summary_en = "A short drafted summary of " + name + " for review.";
    const summary_ar = "ملخّص قصير مُسوّد عن " + name + " للمراجعة.";

    const fields_meta: Record<string, FieldMeta> = {
      overview: {
        origin: "ai",
        confidence: overviewConf,
        band: band(overviewConf),
        sources: [{ domain: siteDomain }],
      },
      summary: {
        origin: "ai",
        confidence: summaryConf,
        band: band(summaryConf),
        sources: summaryConf >= 0.55 ? [{ domain: "wikipedia.org" }] : [],
      },
      sector: {
        origin: "ai",
        confidence: sectorConf,
        band: band(sectorConf),
        sources: input.hints?.sector_slug
          ? [{ domain: "operator hint" }]
          : sectorConf >= 0.55
            ? [{ domain: "wikipedia.org" }]
            : [],
      },
      founded_year: {
        origin: "ai",
        confidence: foundedConf,
        band: band(foundedConf),
        sources: foundedConf >= 0.55 ? [{ domain: "wikipedia.org" }] : [],
        conflict: foundedConf < 0.5,
      },
    };

    colors.forEach((col, i) => {
      fields_meta["color:" + i] = {
        origin: "ai",
        confidence: col.confidence,
        band: band(col.confidence),
        sources: col.source ? [{ domain: col.source }] : [],
      };
    });
    assets.forEach((a, i) => {
      fields_meta["asset:" + i] = {
        origin: "ai",
        confidence: a.confidence,
        band: band(a.confidence),
        sources: a.confidence >= 0.55 ? [{ domain: siteDomain }] : [],
      };
    });
    timeline.forEach((tl, i) => {
      fields_meta["timeline:" + i] = {
        origin: "ai",
        confidence: tl.confidence,
        band: band(tl.confidence),
        sources: tl.source ? [{ domain: tl.source }] : [],
      };
    });

    const draft: BrandDraft = {
      overview_en,
      overview_ar,
      sector_slug,
      founded_year,
      summary_en,
      summary_ar,
      colors,
      assets,
      timeline,
      fields_meta,
    };

    return { draft, findings: h % 5 === 0 ? "sparse" : "rich" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory — primary -> fallback routing                                     */
/* -------------------------------------------------------------------------- */

/**
 * Returns the configured LlmProvider. Reads LLM_PROVIDER (default "dev").
 *
 * When real providers are wired up they plug in here, e.g.:
 *
 *   case "claude": return new ClaudeLlmProvider(process.env.ANTHROPIC_API_KEY!);
 *   case "gpt":    return new OpenAiLlmProvider(process.env.OPENAI_API_KEY!);
 *   case "gemini": return new GeminiLlmProvider(process.env.GOOGLE_API_KEY!);
 *
 * A production factory would also wrap the primary provider with a fallback
 * (primary -> fallback) so a provider outage degrades gracefully. No external
 * keys are available in Sprint 4, so we always return the deterministic stub.
 */
/** Gating rule: an item is bulk-acceptable only if band is H AND it is sourced. */
export function isHighConfidenceSourced(meta: FieldMeta | undefined): boolean {
  return !!meta && meta.band === "H" && meta.sources.length > 0;
}

export function getLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER || "dev").toLowerCase();
  switch (provider) {
    // case "claude": ...
    // case "gpt": ...
    // case "gemini": ...
    case "dev":
    default:
      return new DevStubLlmProvider();
  }
}
