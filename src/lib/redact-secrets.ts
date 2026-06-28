import "server-only";

/**
 * Redact obvious secret patterns from free-text before it is persisted (WEB-7).
 *
 * Provider error messages (and stack traces) can echo API keys, bearer tokens,
 * or signed URLs. We store `error_detail` for operator debugging, so scrub the
 * common shapes first. Conservative: matches well-known key prefixes, bearer
 * tokens, JWT-looking triples, long base64-ish blobs, and key/token query params.
 * Always called before the existing length cap.
 */
export function redactSecrets(input: string): string {
  if (!input) return input;
  let s = input;

  // OpenAI-style keys: sk-..., sk-proj-..., and similar prefixed tokens.
  s = s.replace(/\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_KEY]");
  // Google API keys: AIza followed by 35 url-safe chars.
  s = s.replace(/\bAIza[0-9A-Za-z_-]{30,}\b/g, "[REDACTED_KEY]");
  // Anthropic-style keys.
  s = s.replace(/\bsk-ant-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_KEY]");
  // GitHub tokens.
  s = s.replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, "[REDACTED_KEY]");

  // Bearer tokens in Authorization headers / messages.
  s = s.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [REDACTED]");

  // JWT-looking tokens: three base64url segments separated by dots.
  s = s.replace(
    /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
    "[REDACTED_JWT]"
  );

  // key=... / token=... / apikey=... / access_token=... query-string values.
  s = s.replace(
    /\b(api[_-]?key|access[_-]?token|token|key|secret|password|pwd)=([^&\s"']+)/gi,
    "$1=[REDACTED]"
  );

  // Long opaque base64-ish blobs (40+ chars) that look like credentials.
  s = s.replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "[REDACTED_BLOB]");

  return s;
}
