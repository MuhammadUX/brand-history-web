import type { MetadataRoute } from "next";
import { getBrands } from "@/lib/data";
import { locales } from "@/i18n";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["", "browse", "discover", "search", "pro", "suggest"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      const suffix = path ? `/${path}` : "";
      entries.push({
        url: `${SITE_URL}/${locale}${suffix}`,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: {
            en: `${SITE_URL}/en${suffix}`,
            ar: `${SITE_URL}/ar${suffix}`,
          },
        },
      });
    }
  }

  // Published brands (RLS already restricts anon reads to published rows).
  let brands: Awaited<ReturnType<typeof getBrands>> = [];
  try {
    brands = await getBrands();
  } catch {
    brands = [];
  }

  for (const brand of brands) {
    const lastModified = brand.last_updated_at
      ? new Date(brand.last_updated_at)
      : undefined;
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/brand/${brand.slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: {
            en: `${SITE_URL}/en/brand/${brand.slug}`,
            ar: `${SITE_URL}/ar/brand/${brand.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
