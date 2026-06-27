/**
 * GeminiLlmProvider — real brand-identity drafting via Google's Gemini API.
 *
 * Uses the v1beta `generateContent` endpoint with the `google_search` and
 * `url_context` grounding tools so the model researches the brand from its
 * official site + the web instead of hallucinating. Shared prompt + parsing
 * live in draft-shared.ts so all providers return comparable drafts.
 *
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional, default
 * "gemini-flash-latest").
 */

import type { LlmProvider, DraftInput, DraftResult } from "./llm-provider";
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractJson,
  buildDraft,
  fetchSectorSlugs,
} from "./draft-shared";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiLlmProvider implements LlmProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    // gemini-2.5-flash is GA with steadier capacity than the just-released
    // "gemini-flash-latest" (3.5), which has been 503-ing under high demand.
    this.model = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  async draftBrandProfile(input: DraftInput): Promise<DraftResult> {
    const url = input.hints?.url?.trim() || null;
    const sectors = await fetchSectorSlugs();

    const body = {
      systemInstruction: { parts: [{ text: buildSystemPrompt(sectors) }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
      tools: [{ google_search: {} }, { url_context: {} }],
      generationConfig: { temperature: 0.2 },
    };

    // Retry transient overload (503) / rate-limit (429) a couple of times with
    // backoff — these are common right after enabling billing or under load.
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(
        `${API_BASE}/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      );
      if (res.ok || (res.status !== 503 && res.status !== 429)) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }

    if (!res || !res.ok) {
      const text = res ? await res.text().catch(() => "") : "";
      throw new Error(`gemini_failed_${res?.status ?? 0}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ??
      "";

    const parsed = extractJson(raw);
    if (!parsed) throw new Error("gemini_unparseable_response");

    return buildDraft(parsed, { url, sectors });
  }
}
