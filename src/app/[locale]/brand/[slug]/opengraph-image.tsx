import { ImageResponse } from "next/og";
import { getBrandBySlug } from "@/lib/data";
import { isLocale } from "@/i18n";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

/**
 * Brand OpenGraph card: brand initials on the brand's primary color. Uses only
 * built-in system fonts (no network fetch) so the build never reaches out.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const brand = await getBrandBySlug(slug);

  const bg = brand?.primary_color || "#3B5BDB";
  const initials = brand?.initials || "BH";
  const name =
    (brand && (safeLocale === "ar" ? brand.name_ar : brand.name_en)) ||
    "Brand History";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 280,
            height: 280,
            borderRadius: 48,
            background: "rgba(255,255,255,0.16)",
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: -4,
          }}
        >
          {initials}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 56,
            fontWeight: 800,
            maxWidth: 1000,
            textAlign: "center",
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 16, fontSize: 28, opacity: 0.85 }}>
          Brand History
        </div>
      </div>
    ),
    { ...size }
  );
}
