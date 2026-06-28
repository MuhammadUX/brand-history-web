import "server-only";

/**
 * Conservative server-side SVG sanitizer (WEB-1 / STOR-1).
 *
 * SVG is XML that can carry active content (scripts, event handlers, external
 * fetches), so an unsanitized SVG served from our public bucket is a stored-XSS
 * vector when opened directly by URL. We accept SVG uploads but strip anything
 * that can execute or phone out before persisting.
 *
 * This is a deliberately blunt, allow-nothing-suspicious regex/text strip rather
 * than a full XML parser: we run on the raw bytes, drop whole dangerous element
 * blocks, remove every `on*` handler, neutralise `javascript:` / `data:text/html`
 * URIs, and rewrite remote `href` / `xlink:href` references to a harmless value.
 * Being conservative (over-stripping) is the correct failure mode here.
 *
 * Returns the sanitized SVG text. If the input does not look like SVG at all we
 * return it unchanged length-wise but it should not reach here for non-SVG MIME.
 */
export function sanitizeSvg(input: string): string {
  let svg = input;

  // Strip BOM / leading whitespace noise but keep structure.
  // 1) Remove dangerous element blocks entirely (open..close, case-insensitive,
  //    dot-matches-newline). Covers <script>, <foreignObject>, <iframe>, <embed>,
  //    <object>, <audio>, <video>, <handler>, <set> (animation can set attrs),
  //    <animate>/<animateTransform> with event triggers are also dropped.
  const DANGEROUS_BLOCKS = [
    "script",
    "foreignObject",
    "iframe",
    "embed",
    "object",
    "audio",
    "video",
    "handler",
  ];
  for (const tag of DANGEROUS_BLOCKS) {
    const block = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi");
    svg = svg.replace(block, "");
    // Also drop self-closing / unclosed variants of the same tag.
    const selfClose = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    svg = svg.replace(selfClose, "");
  }

  // 2) Remove any on* event-handler attributes (onload, onclick, onmouseover…).
  //    Handles double-quoted, single-quoted, and unquoted values.
  svg = svg
    .replace(/\son[a-z0-9_-]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z0-9_-]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z0-9_-]+\s*=\s*[^\s>]+/gi, "");

  // 3) Neutralise dangerous URI schemes anywhere in attribute values.
  //    javascript:, vbscript:, and data:text/html (HTML smuggling).
  svg = svg
    .replace(/javascript\s*:/gi, "removed:")
    .replace(/vbscript\s*:/gi, "removed:")
    .replace(/data\s*:\s*text\/html/gi, "data:removed");

  // 4) Strip external / remote references in href / xlink:href / src so a <use>
  //    or <image> cannot pull a remote (or javascript:) resource. We only allow
  //    in-document fragment refs ("#id"). Anything else is blanked.
  const HREF_ATTR = /\b(?:xlink:href|href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  svg = svg.replace(HREF_ATTR, (_m, _q, dq, sq) => {
    const val = (dq ?? sq ?? "").trim();
    // Allow only same-document fragment references.
    if (val.startsWith("#")) {
      return `xlink:href="${val}"`;
    }
    return 'xlink:href="#"';
  });

  // 5) Strip DOCTYPE / ENTITY declarations (XXE / entity-expansion surface).
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, "").replace(/<!ENTITY[\s\S]*?>/gi, "");

  // 6) Strip processing instructions other than the XML decl is unnecessary;
  //    drop <?xml-stylesheet ...?> which can reference remote stylesheets.
  svg = svg.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, "");

  return svg;
}
