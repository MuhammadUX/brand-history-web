import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import LogoTile from "@/components/LogoTile";
import CopyButton from "@/components/CopyButton";
import DownloadLogoButton from "@/components/DownloadLogoButton";
import BrandKitButton from "@/components/BrandKitButton";
import AdSlot from "@/components/AdSlot";
import FavoriteButton from "@/components/FavoriteButton";
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

  const metaParts = [
    sectorName,
    brand.region,
    brand.founded_year ? `${dict.brand.founded} ${brand.founded_year}` : null,
  ].filter(Boolean);

  const lastUpdated = brand.last_updated_at
    ? new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(brand.last_updated_at))
    : null;

  const badge =
    brand.claim_status === "verified" || brand.is_verified
      ? { label: dict.brand.verified, cls: "bg-verifiedBg text-verifiedText", icon: "✓" }
      : { label: dict.brand.curated, cls: "bg-primary-tint text-primary", icon: "◆" };

  function assetActions(asset: BrandAsset) {
    if (asset.download_policy === "host") {
      return (
        <DownloadLogoButton
          slug={brand!.slug}
          initials={brand!.initials}
          color={brand!.primary_color}
          name={name}
          label={dict.brand.policyHost}
          pngLabel={dict.brand.downloadPng}
          compact
        />
      );
    }
    if (asset.download_policy === "link_out") {
      return (
        <span className="inline-flex rounded-btn border border-border px-4 py-2 text-sm font-medium text-secondary">
          {dict.brand.policyLinkOut}
        </span>
      );
    }
    // Pro-policy asset: Pro users get the real (high-res) action; free users
    // see the PRO lock that opens the paywall.
    if (isProUser) {
      return (
        <BrandKitButton
          locale={typedLocale}
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
        className="inline-flex items-center gap-2 rounded-btn border border-border bg-page px-4 py-2 text-sm font-medium text-secondary transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="rounded-pill bg-sponsoredBg px-2 py-0.5 text-xs font-semibold text-sponsored">
          {dict.brand.policyPro}
        </span>
        {dict.brand.proLink}
      </Link>
    );
  }

  return (
    <>
      <TopNav locale={typedLocale} />
      <main id="main-content">
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-container px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <LogoTile
                initials={brand.initials}
                color={brand.primary_color}
                name={name}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-ink">
                    {name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium ${badge.cls}`}
                  >
                    <span aria-hidden="true">{badge.icon}</span> {badge.label}
                  </span>
                </div>
                <p className="mt-1 text-lg text-secondary" dir={isAr ? "ltr" : "rtl"}>
                  {altName}
                </p>
                {metaParts.length > 0 && (
                  <p className="mt-3 text-sm text-secondary">
                    {metaParts.join(" · ")}
                  </p>
                )}
                {summary && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink">
                    {summary}
                  </p>
                )}
                {lastUpdated && (
                  <p className="mt-4 text-xs text-tertiary">
                    {dict.brand.lastUpdated}: {lastUpdated}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <DownloadLogoButton
                    slug={brand.slug}
                    initials={brand.initials}
                    color={brand.primary_color}
                    name={name}
                    label={dict.brand.downloadLogo}
                    pngLabel={dict.brand.downloadPng}
                  />
                  <CopyButton
                    value={brand.primary_color}
                    label={`${dict.brand.copyColor} (${brand.primary_color})`}
                    copiedLabel={isAr ? "تم النسخ ✓" : "Copied ✓"}
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
                      className="inline-flex items-center justify-center rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {dict.brand.compare}
                    </Link>
                  )}
                  <BrandKitButton
                    locale={typedLocale}
                    slug={brand.slug}
                    initials={brand.initials}
                    color={brand.primary_color}
                    name={name}
                    colors={colors}
                    isPro={isProUser}
                    kind="highres"
                  />
                  <BrandKitButton
                    locale={typedLocale}
                    slug={brand.slug}
                    initials={brand.initials}
                    color={brand.primary_color}
                    name={name}
                    colors={colors}
                    isPro={isProUser}
                    kind="kit"
                  />
                </div>
              </div>
            </div>

            {/* Tab anchors (no JS — simple in-page links) */}
            <nav className="mt-10 flex flex-wrap gap-1 border-b border-border" aria-label="Sections">
              <a
                href="#assets"
                className="rounded-t-btn px-4 py-3 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {dict.brand.tabs.assets}
              </a>
              <a
                href="#guidelines"
                className="rounded-t-btn px-4 py-3 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {dict.brand.tabs.guidelines}
              </a>
              <a
                href="#timeline"
                className="rounded-t-btn px-4 py-3 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {dict.brand.tabs.timeline}
              </a>
              <a
                href="#archive"
                className="rounded-t-btn px-4 py-3 text-sm font-medium text-secondary transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {dict.brand.archiveTitle}
              </a>
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-container px-4 py-10 sm:px-6">
          {/* Assets */}
          <section id="assets" className="scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {dict.brand.assetsTitle}
            </h2>
            {assets.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">{dict.brand.noAssets}</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => {
                  const typeLabel =
                    ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                    asset.asset_type;
                  const assetName = isAr ? asset.name_ar : asset.name_en;
                  return (
                    <div
                      key={asset.id}
                      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5"
                    >
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
                          {typeLabel}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-ink">
                          {assetName}
                        </h3>
                      </div>
                      {asset.formats && asset.formats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {asset.formats.map((f) => (
                            <span
                              key={f}
                              className="rounded-pill bg-page px-2.5 py-0.5 text-xs font-medium text-secondary"
                            >
                              {f.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto pt-2">{assetActions(asset)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sponsored slot (free users only; server-decided) */}
          <div className="mt-10">
            <AdSlot locale={typedLocale} variant="sidebar" />
          </div>

          {/* Guidelines */}
          <section id="guidelines" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {dict.brand.guidelinesTitle}
            </h2>
            {colors.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">{dict.brand.noColors}</p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className="overflow-hidden rounded-card border border-border bg-surface"
                  >
                    <div
                      className="h-24 w-full"
                      style={{ backgroundColor: color.hex }}
                      aria-hidden="true"
                    />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-ink">{color.name}</p>
                      <p className="text-xs uppercase text-tertiary">{color.role}</p>
                      <div className="mt-2">
                        <CopyButton
                          value={color.hex}
                          label={color.hex.toUpperCase()}
                          copiedLabel={isAr ? "تم النسخ ✓" : "Copied ✓"}
                          className="inline-flex w-full items-center justify-center rounded-btn border border-border bg-page px-3 py-1.5 font-mono text-xs text-ink transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-tertiary">
                        {dict.brand.copyHex}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section id="timeline" className="mt-14 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {dict.brand.timelineTitle}
              </h2>
              {timeline.length >= 2 && (
                <Link
                  href={`/${typedLocale}/brand/${brand.slug}/compare`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {dict.brand.compare} →
                </Link>
              )}
            </div>
            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">{dict.brand.noTimeline}</p>
            ) : (
              <ol className="mt-6 space-y-6 border-s border-border ps-6">
                {timeline.map((entry) => {
                  const title = isAr ? entry.title_ar : entry.title_en;
                  const desc = isAr ? entry.description_ar : entry.description_en;
                  return (
                    <li key={entry.id} className="relative">
                      <span
                        className="absolute -start-[1.6rem] top-1.5 h-3 w-3 rounded-pill border-2 border-surface bg-primary"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-ink">
                          {entry.year}
                        </span>
                        {entry.category && (
                          <span className="rounded-pill bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-primary">
                            {entry.category}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-ink">
                        {title}
                      </h3>
                      {desc && (
                        <p className="mt-1 text-sm leading-relaxed text-secondary">
                          {desc}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Archive */}
          <section id="archive" className="mt-14 scroll-mt-24">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {dict.brand.archiveTitle}
            </h2>
            <p className="mt-1 text-sm text-tertiary">{dict.brand.archiveNote}</p>
            {archivedAssets.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">{dict.brand.noArchive}</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archivedAssets.map((asset) => {
                  const typeLabel =
                    ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                    asset.asset_type;
                  const assetName = isAr ? asset.name_ar : asset.name_en;
                  return (
                    <div
                      key={asset.id}
                      className="flex flex-col gap-3 rounded-card border border-dashed border-border bg-page p-5"
                    >
                      <span className="inline-flex w-fit rounded-pill bg-sponsoredBg px-2.5 py-0.5 text-xs font-semibold text-sponsored">
                        {dict.brand.archiveNote}
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-tertiary">
                          {typeLabel}
                          {asset.era ? ` · ${asset.era}` : ""}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-ink">
                          {assetName}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
