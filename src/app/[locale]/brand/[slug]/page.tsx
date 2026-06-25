import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Hero,
  Card,
  SectionHeader,
  AssetTile,
  ColorChip,
  Badge,
  Button,
  StateBlock,
} from "@/components/ui";
import BrandDownloadButton from "@/components/BrandDownloadButton";
import ProDownloadButton from "@/components/ProDownloadButton";
import BrandTimeline from "@/components/BrandTimeline";
import FavoriteButton from "@/components/FavoriteButton";
import AdSlot from "@/components/AdSlot";
import {
  getBrandBySlug,
  getBrandAssets,
  getArchivedAssets,
  getBrandColors,
  getTimeline,
} from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getEntitlements } from "@/lib/entitlements";
import { getDictionary, isLocale } from "@/i18n";
import type { BrandAsset, Locale } from "@/lib/types";
import type { Metadata } from "next";
import { buildMetadata, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const typedLocale = locale as Locale;
  const isAr = typedLocale === "ar";
  const dict = getDictionary(typedLocale);
  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return buildMetadata({
      locale: typedLocale,
      pathAfterLocale: `brand/${slug}`,
      title: `${dict.notFound.title} — ${dict.brandName}`,
      description: dict.notFound.body,
    });
  }
  const name = (isAr ? brand.name_ar : brand.name_en) || brand.name_en;
  const summary =
    (isAr ? brand.summary_ar : brand.summary_en) ||
    `${name} — ${dict.brandName}`;
  const ogUrl = `${SITE_URL}/${typedLocale}/brand/${brand.slug}/opengraph-image`;
  return buildMetadata({
    locale: typedLocale,
    pathAfterLocale: `brand/${brand.slug}`,
    title: `${name} — ${dict.brandName}`,
    description: summary.slice(0, 200),
    images: [{ url: ogUrl, width: 1200, height: 630, alt: name }],
  });
}

const ASSET_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  logo_primary: { en: "Primary logo", ar: "الشعار الأساسي" },
  secondary: { en: "Secondary logo", ar: "الشعار الثانوي" },
  icon: { en: "Icon", ar: "أيقونة" },
  wordmark: { en: "Wordmark", ar: "الاسم المكتوب" },
  monochrome: { en: "Monochrome", ar: "أحادي اللون" },
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const isAr = typedLocale === "ar";

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [assets, archivedAssets, colors, timeline, favCtx, entitlements] =
    await Promise.all([
      getBrandAssets(brand.id),
      getArchivedAssets(brand.id),
      getBrandColors(brand.id),
      getTimeline(brand.id),
      getFavoritesContext(),
      getEntitlements(),
    ]);
  const isFavorited = favCtx.favoriteIds.includes(brand.id);
  const isProUser = entitlements.high_res && entitlements.bulk_zip;

  const name = isAr ? brand.name_ar : brand.name_en;
  const altName = isAr ? brand.name_en : brand.name_ar;
  const sectorName =
    brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
  const summary = isAr ? brand.summary_ar : brand.summary_en;
  const isVerified = brand.claim_status === "verified" || brand.is_verified;

  const metaChips = [
    sectorName,
    brand.region,
    brand.founded_year ? `${dict.brand.founded} ${brand.founded_year}` : null,
  ].filter(Boolean) as string[];

  const lastUpdated = brand.last_updated_at
    ? new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(brand.last_updated_at))
    : null;

  // Per-asset action — preserves the host / link-out / Pro policy + Pro gating.
  function assetAction(asset: BrandAsset) {
    if (asset.download_policy === "host") {
      return (
        <BrandDownloadButton
          slug={brand!.slug}
          initials={brand!.initials}
          color={brand!.primary_color}
          name={name}
          label={dict.brand.policyHost}
          pngLabel={dict.brand.downloadPng}
          svgLabel={dict.brand.downloadSvg}
          triggerVariant="ghost"
        />
      );
    }
    if (asset.download_policy === "link_out") {
      return (
        <span className="text-[11px] font-semibold text-muted">
          {dict.brand.policyLinkOut}
        </span>
      );
    }
    return (
      <ProDownloadButton
        locale={typedLocale}
        brandId={brand!.id}
        isPro={isProUser}
        kind="highres"
      />
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      {/* ── Hero ── */}
      <Hero
        name={name}
        arName={altName}
        initials={brand.initials}
        domain={brand.website}
        color={brand.primary_color}
        verified={isVerified}
        meta={metaChips}
        actions={
          <>
            <BrandDownloadButton
              slug={brand.slug}
              initials={brand.initials}
              color={brand.primary_color}
              name={name}
              label={dict.brand.downloadKit}
              pngLabel={dict.brand.downloadPng}
              svgLabel={dict.brand.downloadSvg}
            />
            <FavoriteButton
              brandId={brand.id}
              brandName={name}
              locale={typedLocale}
              initialFavorited={isFavorited}
              initialAuthed={favCtx.isAuthed}
              variant="button"
            />
            {timeline.length >= 2 && (
              <Button
                href={`/${typedLocale}/brand/${brand.slug}/compare`}
                variant="ghost"
                size="sm"
              >
                {dict.brand.compare}
              </Button>
            )}
            <ProDownloadButton
              locale={typedLocale}
              brandId={brand.id}
              isPro={isProUser}
              kind="kit"
            />
          </>
        }
      />

      {summary && (
        <p className="mt-5 max-w-[68ch] text-[15px] leading-relaxed text-ink">
          {summary}
        </p>
      )}
      {lastUpdated && (
        <p className="label mt-3">
          {dict.brand.lastUpdated}: {lastUpdated}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        {/* ── Logos & assets ── */}
        <Card title={dict.brand.assetsTitle}>
          {assets.length === 0 ? (
            <StateBlock state="empty" icon="📭" message={dict.brand.noAssets} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {assets.map((asset) => {
                const typeLabel =
                  ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                  asset.asset_type;
                const fmt = asset.formats?.[0]?.toUpperCase();
                return (
                  <AssetTile
                    key={asset.id}
                    name={isAr ? asset.name_ar : asset.name_en || typeLabel}
                    format={fmt}
                    domain={brand.website}
                    initials={brand.initials}
                    color={brand.primary_color}
                    ground="light"
                    action={assetAction(asset)}
                  />
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Colors ── */}
        <Card title={dict.brand.guidelinesTitle}>
          {colors.length === 0 ? (
            <StateBlock state="empty" icon="🎨" message={dict.brand.noColors} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {colors.map((color) => (
                <ColorChip
                  key={color.id}
                  name={color.name}
                  hex={color.hex}
                  role={color.role}
                  copyLabel={isAr ? "نسخ" : "COPY"}
                  copiedLabel={isAr ? "تم النسخ" : "COPIED"}
                />
              ))}
              <p className="label mt-1">{dict.brand.copyHex}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Sponsored slot (free users only; server-decided) */}
      <div className="mt-6">
        <AdSlot locale={typedLocale} variant="row" />
      </div>

      {/* ── Timeline preview ── */}
      <section id="timeline" className="mt-6 scroll-mt-24">
        <SectionHeader
          title={dict.brand.timelineTitle}
          action={
            timeline.length >= 2 ? (
              <Link
                href={`/${typedLocale}/brand/${brand.slug}/compare`}
                className="text-[13px] font-semibold text-link hover:underline"
              >
                {dict.brand.compare} →
              </Link>
            ) : undefined
          }
        />
        {timeline.length === 0 ? (
          <StateBlock state="empty" icon="🗓️" message={dict.brand.noTimeline} />
        ) : (
          <Card>
            <BrandTimeline
              entries={timeline}
              locale={typedLocale}
              color={brand.primary_color}
            />
          </Card>
        )}
      </section>

      {/* ── Archive ── */}
      <section id="archive" className="mt-6 scroll-mt-24">
        <SectionHeader title={dict.brand.archiveTitle} />
        <p className="label mb-3">
          <Badge kind="archived" className="me-2" />
          {dict.brand.archiveNote}
        </p>
        {archivedAssets.length === 0 ? (
          <StateBlock state="empty" icon="🗄️" message={dict.brand.noArchive} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedAssets.map((asset) => {
              const typeLabel =
                ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                asset.asset_type;
              return (
                <AssetTile
                  key={asset.id}
                  name={`${isAr ? asset.name_ar : asset.name_en || typeLabel}${
                    asset.era ? ` · ${asset.era}` : ""
                  }`}
                  domain={brand.website}
                  initials={brand.initials}
                  color={brand.primary_color}
                  ground="brand"
                  archived
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
