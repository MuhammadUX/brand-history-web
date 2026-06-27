/**
 * Server-only LLM provider factory.
 *
 * Kept separate from llm-provider.ts because the grounded providers import
 * Supabase / next/headers (via draft-shared) — importing those into a client
 * component would break the build. Only server code (the AI builder action)
 * imports this module.
 */

import {
  DevStubLlmProvider,
  type LlmProvider,
  type DraftInput,
  type DraftResult,
} from "./llm-provider";
import { GeminiLlmProvider } from "./gemini-provider";
import { ClaudeLlmProvider } from "./claude-provider";

/** Provider keys the operator can pick in the AI builder UI. */
export const SELECTABLE_PROVIDERS = ["gemini", "claude"] as const;
export type ProviderKey = (typeof SELECTABLE_PROVIDERS)[number];

/** Build a single provider by key; null if its required key is missing. */
function buildProvider(key: string): LlmProvider | null {
  switch (key.trim().toLowerCase()) {
    case "gemini": {
      const k = process.env.GEMINI_API_KEY;
      return k ? new GeminiLlmProvider(k) : null;
    }
    case "claude": {
      const k = process.env.ANTHROPIC_API_KEY;
      return k ? new ClaudeLlmProvider(k) : null;
    }
    // case "gpt": { const k = process.env.OPENAI_API_KEY; ... }
    case "dev":
      return new DevStubLlmProvider();
    default:
      return null;
  }
}

/** Tries each provider in order until one returns without throwing. */
class FallbackLlmProvider implements LlmProvider {
  constructor(private providers: LlmProvider[]) {}
  async draftBrandProfile(input: DraftInput): Promise<DraftResult> {
    let lastErr: unknown;
    for (const p of this.providers) {
      try {
        return await p.draftBrandProfile(input);
      } catch (e) {
        console.error("[llm] provider failed, trying next:", e);
        lastErr = e;
      }
    }
    throw lastErr ?? new Error("no_llm_provider_available");
  }
}

/**
 * Returns the active provider. `preferred` (the operator's per-run choice) is
 * tried first, then the LLM_PROVIDER priority list (default "gemini,claude,dev").
 * The dev stub at the end guarantees the pipeline never hard-fails.
 */
export function getLlmProvider(preferred?: string): LlmProvider {
  const envList = (process.env.LLM_PROVIDER || "gemini,claude,dev")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const order = [...(preferred ? [preferred] : []), ...envList];
  const seen = new Set<string>();
  const providers: LlmProvider[] = [];
  for (const key of order) {
    const k = key.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    const p = buildProvider(k);
    if (p) providers.push(p);
  }
  if (providers.length === 0) return new DevStubLlmProvider();
  return new FallbackLlmProvider(providers);
}
