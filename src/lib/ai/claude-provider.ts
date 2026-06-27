/**
 * ClaudeLlmProvider — real brand-identity drafting via Anthropic's Messages API.
 *
 * Grounds the model with the built-in `web_search` server tool so it researches
 * the brand from the live web instead of memory. Shares the prompt + JSON
 * contract + mapping with the other providers (draft-shared.ts).
 *
 * Env: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional, default
 * "claude-sonnet-4-6").
 */

import type { LlmProvider, DraftInput, DraftResult } from "./llm-provider";
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractJson,
  buildDraft,
  fetchSectorSlugs,
} from "./draft-shared";

const API_URL = "https://api.anthropic.com/v1/messages";

export class ClaudeLlmProvider implements LlmProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  }

  async draftBrandProfile(input: DraftInput): Promise<DraftResult> {
    const url = input.hints?.url?.trim() || null;
    const sectors = await fetchSectorSlugs();

    const body = {
      model: this.model,
      max_tokens: 4096,
      temperature: 0.2,
      system: buildSystemPrompt(sectors),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`claude_failed_${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    // Concatenate only the assistant's text blocks (skip server_tool_use and
    // web_search_tool_result blocks). The JSON object is in the final text.
    const raw =
      data.content
        ?.filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text as string)
        .join("") ?? "";

    const parsed = extractJson(raw);
    if (!parsed) throw new Error("claude_unparseable_response");

    return buildDraft(parsed, { url, sectors });
  }
}
