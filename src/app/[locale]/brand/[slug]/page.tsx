import Link from "next/link";
import { notFound } from "next/navigation";
import CopyHexButton from "@/components/CopyHexButton";
import BrandDownloadModal from "@/components/BrandDownloadModal";
import BrandKitButton from "@/components/BrandKitButton";
import BrandTimeline from "@/components/BrandTimeline";
import FavoriteButton from "@/components/FavoriteButton";
import AdSlot from "@/components/AdSlot";
import { catalogueCode } from "@/components/DsBrandCard";
import {
  Shell,
  SectionHeader,
  MetaStrip,
  CodeChip,
  Badge,
  ButtonGroup,
  Table,
  THead,
  TRow,
  TCell,
  ActionCell,
  StateBlock,
} from "@/components/ds";
import { BrandMark } from "@/components/BrandMark";
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
  const code = catalogueCode(brand.slug || brand.id);

  const metaParts = [
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

  const isVerified = brand.claim_status === "verified" || brand.is_verified;

  // Asset-cell action (host download / link-out / pro), preserving the policy
  // and Pro-gating logic — re-skinned to DS controls.
  function assetAction(asset: BrandAsset) {
    if (asset.download_policy === "host") {
      return (
        <BrandDownloadModal
          slug={brand!.slug}
          initials={brand!.initials}
          color={brand!.primary_color}
          name={name}
          label={dict.brand.policyHost}
          pngLabel={dict.brand.downloadPng}
          svgLabel={dict.brand.downloadSvg}
          code={code}
          triggerVariant="ghost"
        />
      );
    }
    if (asset.download_policy === "link_out") {
      return (
        <span className="label-mono text-metadata">
          {dict.brand.policyLinkOut}
        </span>
      );
    }
    if (isProUser) {
      return (
        <BrandKitButton
          locale={typedLocale}
          brandId={brand!.id}
          slug={brand!.slug}
          initials={brand!.initials}
          color={brand!.primary_color}
          name={name}
          colors={colors}
          isPro
          kind="highres"
        />
      );
    }
    return (
      <Link
        href={`/${typedLocale}/pro`}
        className="label-mono mo-invert inline-flex items-center gap-1 border border-ink px-1 py-0.5 text-ink hover:bg-ink hover:text-paper"
      >
        [ {dict.brand.policyPro} ] {dict.brand.proLink}
      </Link>
    );
  }

  return (
    <main id="main-content">
      <Shell>
        {/* ── Hero ── */}
        <section className="py-8">
          <MetaStrip
            className="mb-3"
            items={[<CodeChip key="c" code={code} />, sectorName || "—", brand.region || "—"]}
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <BrandMark
              domain={brand.website}
              initials={brand.initials}
              size="lg"
              code={code}
              aria-label={`${name} specimen plate`}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[32px] leading-tight text-ink">
                  {name}
                </h1>
                {isVerified ? (
                  <Badge kind="verified" />
                ) : (
                  <Badge kind="filter">◆ {dict.brand.curated}</Badge>
                )}
              </div>
              <p
                className="mt-1 font-arabic text-lg text-ink-700"
                dir={isAr ? "ltr" : "rtl"}
              >
                {altName}
              </p>
              {metaParts.length > 0 && (
                <MetaStrip className="mt-3" items={metaParts} />
              )}
              {summary && (
                <p className="mt-4 max-w-2xl font-mono text-[15px] leading-6 text-ink">
                  {summary}
                </p>
              )}
              {lastUpdated && (
                <p className="mt-3 label-mono text-metadata">
                  {dict.brand.lastUpdated}: {lastUpdated}
                </p>
              )}

              {/* Actions — one primary (Download), rest secondary/ghost */}
              <div className="mt-6">
                <ButtonGroup className="flex-wrap">
                  <BrandDownloadModal
                    slug={brand.slug}
                    initials={brand.initials}
                    color={brand.primary_color}
                    name={name}
                    label={dict.brand.downloadLogo}
                    pngLabel={dict.brand.downloadPng}
                    svgLabel={dict.brand.downloadSvg}
                    code={code}
                  />
                  <CopyHexButton
                    value={brand.primary_color}
                    label={`${dict.brand.copyColor} (${brand.primary_color})`}
                    copiedLabel={isAr ? "تم النسخ" : "COPIED"}
                    className="mo-invert mo-press inline-flex h-10 items-center justify-center border border-ink px-2 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper"
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
                    <Link
                      href={`/${typedLocale}/brand/${brand.slug}/compare`}
                      className="mo-invert mo-press inline-flex h-10 items-center justify-center border border-ink px-2 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper"
                    >
                      {dict.brand.compare}
                    </Link>
                  )}
                  <BrandKitButton
                    locale={typedLocale}
                    brandId={brand.id}
                    slug={brand.slug}
                    initials={brand.initials}
                    color={brand.primary_color}
                    name={name}
                    colors={colors}
                    isPro={isProUser}
                    kind="kit"
                  />
                </ButtonGroup>
              </div>
            </div>
          </div>
        </section>

        {/* ── Assets ledger ── */}
        <section id="assets" className="scroll-mt-24 py-6">
          <SectionHeader index="01" title={dict.brand.assetsTitle} as="h2" meta={`N=${assets.length}`} />
          {assets.length === 0 ? (
            <div className="mt-5 max-w-md">
              <StateBlock state="empty" message={dict.brand.noAssets} />
            </div>
          ) : (
            <div className="mt-5">
              <Table>
                <THead>
                  <TCell head>TYPE</TCell>
                  <TCell head>NAME</TCell>
                  <TCell head>FORMATS</TCell>
                  <TCell head align="end">ACTION</TCell>
                </THead>
                <tbody>
                  {assets.map((asset) => {
                    const typeLabel =
                      ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                      asset.asset_type;
                    return (
                      <TRow key={asset.id}>
                        <TCell>{typeLabel}</TCell>
                        <TCell>{isAr ? asset.name_ar : asset.name_en}</TCell>
                        <TCell>
                          {asset.formats && asset.formats.length > 0
                            ? asset.formats.map((f) => f.toUpperCase()).join(" · ")
                            : "—"}
                        </TCell>
                        <ActionCell>{assetAction(asset)}</ActionCell>
                      </TRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </section>

        {/* Sponsored slot (free users only; server-decided) */}
        <div className="py-2">
          <AdSlot locale={typedLocale} variant="sidebar" />
        </div>

        {/* ── Guidelines (colors) ledger ── */}
        <section id="guidelines" className="scroll-mt-24 py-6">
          <SectionHeader index="02" title={dict.brand.guidelinesTitle} as="h2" meta={`N=${colors.length}`} />
          {colors.length === 0 ? (
            <div className="mt-5 max-w-md">
              <StateBlock state="empty" message={dict.brand.noColors} />
            </div>
          ) : (
            <div className="mt-5">
              <Table>
                <THead>
                  <TCell head>SWATCH</TCell>
                  <TCell head>NAME</TCell>
                  <TCell head>ROLE</TCell>
                  <TCell head align="end">HEX</TCell>
                </THead>
                <tbody>
                  {colors.map((color) => (
                    <TRow key={color.id}>
                      <TCell>
                        <span
                          className="inline-block h-5 w-5 border border-hairline align-middle"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden="true"
                        />
                      </TCell>
                      <TCell>{color.name}</TCell>
                      <TCell className="uppercase text-metadata">{color.role}</TCell>
                      <ActionCell>
                        <CopyHexButton
                          value={color.hex}
                          label={color.hex.toUpperCase()}
                          copiedLabel={isAr ? "تم النسخ" : `COPIED ${color.hex.toUpperCase()}`}
                          className="mo-invert mo-press inline-flex items-center justify-center border border-hairline bg-paper px-2 py-1 font-mono text-[11px] tabular-nums text-ink hover:border-ink hover:bg-ink hover:text-paper"
                        />
                      </ActionCell>
                    </TRow>
                  ))}
                </tbody>
              </Table>
              <p className="mt-2 label-mono text-metadata">{dict.brand.copyHex}</p>
            </div>
          )}
        </section>

        {/* ── Timeline strata ── */}
        <section id="timeline" className="scroll-mt-24 py-6">
          <SectionHeader
            index="03"
            title={dict.brand.timelineTitle}
            as="h2"
            meta={
              timeline.length >= 2 ? (
                <Link
                  href={`/${typedLocale}/brand/${brand.slug}/compare`}
                  className="label-mono text-ink mo-underline"
                >
                  {dict.brand.compare} →
                </Link>
              ) : (
                `N=${timeline.length}`
              )
            }
          />
          {timeline.length === 0 ? (
            <div className="mt-5 max-w-md">
              <StateBlock state="empty" message={dict.brand.noTimeline} />
            </div>
          ) : (
            <BrandTimeline entries={timeline} locale={typedLocale} />
          )}
        </section>

        {/* ── Archive ledger ── */}
        <section id="archive" className="scroll-mt-24 py-6">
          <SectionHeader
            index="04"
            title={dict.brand.archiveTitle}
            as="h2"
            meta={`N=${archivedAssets.length}`}
          />
          <p className="mt-1 label-mono text-metadata">{dict.brand.archiveNote}</p>
          {archivedAssets.length === 0 ? (
            <div className="mt-5 max-w-md">
              <StateBlock state="empty" message={dict.brand.noArchive} />
            </div>
          ) : (
            <div className="mt-5">
              <Table>
                <THead>
                  <TCell head>TYPE</TCell>
                  <TCell head>ERA</TCell>
                  <TCell head>NAME</TCell>
                  <TCell head align="end">STATUS</TCell>
                </THead>
                <tbody>
                  {archivedAssets.map((asset) => {
                    const typeLabel =
                      ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                      asset.asset_type;
                    return (
                      <TRow key={asset.id}>
                        <TCell>{typeLabel}</TCell>
                        <TCell>{asset.era ?? "—"}</TCell>
                        <TCell>{isAr ? asset.name_ar : asset.name_en}</TCell>
                        <ActionCell>
                          <Badge kind="unpublished">ARCHIVED</Badge>
                        </ActionCell>
                      </TRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </section>
      </Shell>
    </main>
  );
}
