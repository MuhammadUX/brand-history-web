import type { Metadata } from "next";
import type { Locale } from "./types";

/** Canonical site origin. Override with NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://brand-history.app";

/**
 * Builds hreflang alternates (en/ar + x-default) for a path *after* the locale
 * segment, e.g. pathAfterLocale = "" → "/en", "/ar"; "brand/aramco" → "/en/brand/aramco".
 */
export function localeAlternates(pathAfterLocale: string) {
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : "";
  return {
    languages: {
      en: `${SITE_URL}/en${suffix}`,
      ar: `${SITE_URL}/ar${suffix}`,
      "x-default": `${SITE_URL}/en${suffix}`,
    },
  };
}

/**
 * Common metadata factory: title/description + canonical + hreflang +
 * OpenGraph + Twitter card. `images` defaults to none; brand pages pass an OG route.
 */
export function buildMetadata(opts: {
  locale: Locale;
  pathAfterLocale: string;
  title: string;
  description: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  const { locale, pathAfterLocale, title, description, images } = opts;
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : "";
  const canonical = `${SITE_URL}/${locale}${suffix}`;
  const ogLocale = locale === "ar" ? "ar_SA" : "en_US";

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      ...localeAlternates(pathAfterLocale),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Brand History",
      locale: ogLocale,
      type: "website",
      images,
    },
    twitter: {
      card: images && images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
