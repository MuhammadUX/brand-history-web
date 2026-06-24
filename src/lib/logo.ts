/**
 * Generates a placeholder brand logo as an SVG string: the brand initials
 * centered on a rounded tile of the brand's primary color, with the brand
 * name beneath. Used for real, copyright-free logo downloads.
 */

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface LogoSvgOptions {
  initials: string;
  color: string;
  name: string;
  /** Total SVG canvas size in px (square). Default 512. */
  size?: number;
}

export function buildLogoSvg({
  initials,
  color,
  name,
  size = 512,
}: LogoSvgOptions): string {
  const textColor = isLightColor(color) ? "#16181D" : "#FFFFFF";
  const tile = Math.round(size * 0.66);
  const tileX = Math.round((size - tile) / 2);
  const tileY = Math.round(size * 0.12);
  const radius = Math.round(tile * 0.18);
  const cx = size / 2;
  const tileCy = tileY + tile / 2;
  const initialsFont = Math.round(tile * 0.42);
  const nameFont = Math.round(size * 0.07);
  const nameY = tileY + tile + Math.round(size * 0.12);
  const safeInitials = escapeXml(initials || name.slice(0, 2).toUpperCase());
  const safeName = escapeXml(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${safeName} logo placeholder">
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${radius}" ry="${radius}" fill="${color}"/>
  <text x="${cx}" y="${tileCy}" fill="${textColor}" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="${initialsFont}" font-weight="700" text-anchor="middle" dominant-baseline="central">${safeInitials}</text>
  <text x="${cx}" y="${nameY}" fill="#16181D" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="${nameFont}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${safeName}</text>
</svg>`;
}
