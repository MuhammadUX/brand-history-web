import en, { type Dictionary } from "./en";
import ar from "./ar";
import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["en", "ar"];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/**
 * Open-redirect guard. Returns `next` only if it is a same-site relative path:
 * it must start with a single "/" and carry no scheme/host. Anything else
 * (protocol-relative "//", backslash tricks, absolute URLs) falls back to the
 * locale account page.
 */
export function safeNext(
  next: string | null | undefined,
  locale: Locale
): string {
  const fallback = `/${locale}/account`;
  if (!next) return fallback;
  // Must be a relative path starting with exactly one forward slash.
  if (!next.startsWith("/")) return fallback;
  // Reject protocol-relative ("//host") and backslash variants ("/\").
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Reject any backslashes (browsers may treat them as slashes).
  if (next.includes("\\")) return fallback;
  // Reject anything that looks like it carries a scheme/host.
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}

export type { Dictionary };
