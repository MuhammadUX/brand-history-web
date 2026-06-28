/**
 * URL scheme guard for operator-supplied links (WEB-5).
 *
 * Operator-entered `source_url` / `sourceUrl` values are rendered as anchor
 * `href`s on public pages. A value like `javascript:...` (or `data:`, `vbscript:`)
 * would execute on click. `safeHref` returns the URL only if it is an absolute
 * http(s) URL; otherwise it returns null so the caller renders no link.
 *
 * Relative paths are intentionally NOT allowed here — these fields hold external
 * source links, so anything that isn't http(s) is dropped.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return null;
  } catch {
    // Not an absolute URL (e.g. "javascript:alert(1)" parses but is filtered
    // above; a bare path throws here) → no link.
    return null;
  }
}
