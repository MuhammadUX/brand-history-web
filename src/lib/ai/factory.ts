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
      if (!k) {
        console.warn("[llm] gemini requested but GEMINI_API_KEY is not set — skipping");
        return null;
      }
      return new GeminiLlmProvider(k);
    }
    case "claude": {
      const k = process.env.ANTHROPIC_API_KEY;
      if (!k) {
        console.warn("[llm] claude requested but ANTHROPIC_API_KEY is not set — skipping");
        return null;
      }
      return new ClaudeLlmProvider(k);
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

/** Thrown when no real provider is configured (so the action can surface it). */
class UnconfiguredLlmProvider implements LlmProvider {
  async draftBrandProfile(): Promise<DraftResult> {
    throw new Error("ai_not_configured");
  }
}

/**
 * Returns the active provider. `preferred` (the operator's per-run choice) is
 * tried first, then the LLM_PROVIDER priority list (default "gemini,claude").
 *
 * The deterministic dev stub is NO LONGER a silent fallback — it only runs when
 * explicitly requested via LLM_PROVIDER=dev. If no real provider is configured,
 * we return a provider that throws `ai_not_configured` so the caller shows a
 * clear error instead of fake "stub" data.
 */
export function getLlmProvider(preferred?: string): LlmProvider {
  // If the operator explicitly chose a model and it's configured, use ONLY that
  // model — no cross-fallback to the other AI — so the result/error reflects the
  // model they picked (e.g. a Gemini quota error, not a Claude billing error).
  if (preferred) {
    const chosen = buildProvider(preferred.trim().toLowerCase());
    if (chosen) {
      console.info(`[llm] using selected provider: ${preferred}`);
      return chosen;
    }
    console.warn(
      `[llm] selected provider "${preferred}" is not configured — falling back to LLM_PROVIDER chain.`
    );
  }

  const envList = (process.env.LLM_PROVIDER || "gemini,claude")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const order = [...envList];
  const seen = new Set<string>();
  const deduped: string[] = [];
  const providers: LlmProvider[] = [];
  for (const key of order) {
    const k = key.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(k);
    const p = buildProvider(k);
    if (p) providers.push(p);
  }
  if (providers.length === 0) {
    console.warn(
      `[llm] no real provider configured (requested: ${deduped.join(",") || "none"}). Set GEMINI_API_KEY / ANTHROPIC_API_KEY.`
    );
    return new UnconfiguredLlmProvider();
  }
  console.info(`[llm] using providers in order: ${deduped.join(",")}`);
  return new FallbackLlmProvider(providers);
}
