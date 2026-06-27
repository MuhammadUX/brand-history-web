/**
 * Map a provider error to a stable code the review page renders a message for.
 *
 * Shared between the AI-builder server action (kickoff) and the background
 * worker route so both classify failures identically (DRY).
 */
export function classifyAiError(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (msg.includes("ai_not_configured")) return "not_configured";
  if (/503|unavailable|overload|high demand|temporarily/.test(msg)) return "busy";
  if (/429|quota|rate.?limit|resource_exhausted/.test(msg)) return "quota";
  if (/credit balance|billing|payment|insufficient|402|too low/.test(msg))
    return "billing";
  if (/unparseable|invalid_response|unexpected/.test(msg)) return "parse";
  if (/401|403|api key|unauthorized|permission/.test(msg)) return "auth";
  return "unknown";
}
