/**
 * Color helpers — derive RGB / HSL strings from a HEX value entirely in code
 * (never relies on the database carrying those formats). Used by the color
 * swatches' HEX / RGB / HSL copy affordance.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Normalize "#abc" | "abc" | "#aabbcc" → "#aabbcc" (lowercase). null if invalid. */
export function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return `#${h}`;
}

/** Parse a HEX string to {r,g,b} (0–255). Returns null for invalid input. */
export function hexToRgb(hex: string): Rgb | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const h = norm.slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Convert a HEX string to {h,s,l} (h 0–360, s/l 0–100). null for invalid input. */
export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** "rgb(r, g, b)" or null. */
export function formatRgb(hex: string): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : null;
}

/** "hsl(h, s%, l%)" or null. */
export function formatHsl(hex: string): string | null {
  const hsl = hexToHsl(hex);
  return hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : null;
}

export type ColorFormat = "HEX" | "RGB" | "HSL";

/** All three string formats for a hex, keyed by format label. null entries are dropped by callers. */
export function colorFormats(hex: string): Record<ColorFormat, string> | null {
  const norm = normalizeHex(hex);
  const rgb = formatRgb(hex);
  const hsl = formatHsl(hex);
  if (!norm || !rgb || !hsl) return null;
  return { HEX: norm.toUpperCase(), RGB: rgb, HSL: hsl };
}
