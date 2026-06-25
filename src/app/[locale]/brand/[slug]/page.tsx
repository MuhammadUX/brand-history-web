import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Hero,
  Card,
  SectionHeader,
  AssetTile,
  Badge,
  Button,
  StateBlock,
  CreditLine,
  EvolutionStrip,
  ProfileSubNav,
  UsageRules,
  ColorGroups,
  FontSpecimen,
  ApplicationGrid,
} from "@/components/ui";
import type { EvolutionEra, SubNavItem } from "@/components/ui";
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
  getBrandFonts,
  getBrandGuidelines,
  getBrandApplications,
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
  const p = dict.brand.profile;
  const isAr = typedLocale === "ar";

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [
    assets,
    archivedAssets,
    colors,
    timeline,
    fonts,
    guidelines,
    applications,
    favCtx,
    entitlements,
  ] = await Promise.all([
    getBrandAssets(brand.id),
    getArchivedAssets(brand.id),
    getBrandColors(brand.id),
    getTimeline(brand.id),
    getBrandFonts(brand.id),
    getBrandGuidelines(brand.id),
    getBrandApplications(brand.id),
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
  const voice = isAr ? brand.voice_ar : brand.voice_en;
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

  // ── Credit line text: "Identity by {designer}{ & agency}" ──
  const creditParts = [brand.designer_credit, brand.agency].filter(
    Boolean,
  ) as string[];
  const creditText =
    creditParts.length > 0
      ? `${p.identityBy} ${creditParts.join(` ${p.and} `)}`
      : null;

  // ── Evolution eras (map timeline → serializable eras) ──
  const eras: EvolutionEra[] = timeline.map((e) => ({
    id: e.id,
    year: e.year,
    title: (isAr ? e.title_ar : e.title_en) || e.title_en,
    caption: (isAr ? e.description_ar : e.description_en) ?? null,
    changeKind: e.change_kind ?? null,
    logoUrl: e.logo_url ?? null,
    credit: e.credit ?? null,
    sourceUrl: e.source_url ?? null,
  }));
  const compareHref = `/${typedLocale}/brand/${brand.slug}/compare`;

  // ── Section presence (honest empty: hide sections with no data) ──
  const hasEvolution = eras.length >= 2;
  const hasAssets = assets.length > 0;
  const hasUsageRules =
    Boolean(brand.clear_space || brand.min_size) || guidelines.length > 0;
  const hasColors = colors.length > 0;
  const hasFonts = fonts.length > 0;
  const hasTimeline = timeline.length > 0;
  const hasArchive = archivedAssets.length > 0;
  const hasHistory = hasTimeline || hasArchive;
  const hasApplications = applications.length > 0;
  const hasAbout = Boolean(summary || voice || creditText);

  // ── Sub-nav: only anchors whose section has data ──
  const subNavItems: SubNavItem[] = [
    hasAssets ? { id: "assets", label: p.nav.assets } : null,
    hasColors ? { id: "colors", label: p.nav.colors } : null,
    hasFonts ? { id: "type", label: p.nav.type } : null,
    hasApplications ? { id: "applications", label: p.nav.applications } : null,
    hasHistory ? { id: "history", label: p.nav.history } : null,
    hasAbout ? { id: "about", label: p.nav.about } : null,
  ].filter(Boolean) as SubNavItem[];

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
    <>
      {subNavItems.length > 1 ? (
        <ProfileSubNav items={subNavItems} ariaLabel={p.subnavAria} />
      ) : null}

      <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
        {/* ── 1 · Identity hero ── */}
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
              {hasEvolution && (
                <Button href={compareHref} variant="ghost" size="sm">
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

        {/* Compact credit + last-updated provenance line. */}
        <CreditLine
          className="mt-3.5"
          creditText={creditText}
          sourceUrl={brand.credit_source_url}
          sourceLabel={p.source}
          lastUpdated={
            lastUpdated ? `${dict.brand.lastUpdated}: ${lastUpdated}` : null
          }
        />

        {/* Short hero summary (1–2 lines); full About lives at the end. */}
        {summary && (
          <p className="mt-3 line-clamp-2 max-w-[68ch] text-[15px] leading-relaxed text-ink">
            {summary}
          </p>
        )}

        {/* ── 2 · Evolution Strip (signature) ── */}
        {hasEvolution && (
          <section id="evolution" className="mt-6 scroll-mt-24">
            <EvolutionStrip
              eras={eras}
              domain={brand.website}
              initials={brand.initials}
              color={brand.primary_color}
              compareHref={compareHref}
              locale={typedLocale}
            />
          </section>
        )}

        {/* ── 3 · Logos & assets + usage rules ── */}
        {hasAssets && (
          <section id="assets" className="mt-6 scroll-mt-24">
            <Card title={dict.brand.assetsTitle}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => {
                  const typeLabel =
                    ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                    asset.asset_type;
                  const fmt = asset.formats?.[0]?.toUpperCase();
                  const aName =
                    (isAr ? asset.name_ar : asset.name_en) || typeLabel;
                  return (
                    <AssetTile
                      key={`${asset.id}-light`}
                      name={aName}
                      format={fmt}
                      domain={brand.website}
                      initials={brand.initials}
                      color={brand.primary_color}
                      ground="light"
                      action={assetAction(asset)}
                    />
                  );
                })}
                {/* Dark-ground previews of the primary marks. */}
                {assets.slice(0, 3).map((asset) => {
                  const typeLabel =
                    ASSET_TYPE_LABELS[asset.asset_type]?.[isAr ? "ar" : "en"] ??
                    asset.asset_type;
                  const aName =
                    (isAr ? asset.name_ar : asset.name_en) || typeLabel;
                  return (
                    <AssetTile
                      key={`${asset.id}-dark`}
                      name={aName}
                      domain={brand.website}
                      initials={brand.initials}
                      color={brand.primary_color}
                      ground="dark"
                    />
                  );
                })}
              </div>

              {/* Usage rules sub-block (hidden when no data). */}
              {hasUsageRules && (
                <UsageRules
                  clearSpace={brand.clear_space}
                  minSize={brand.min_size}
                  guidelines={guidelines}
                  isAr={isAr}
                  labels={{
                    heading: p.usageRules,
                    clearSpace: p.clearSpace,
                    minSize: p.minSize,
                    do: p.do,
                    dont: p.dont,
                  }}
                />
              )}
            </Card>
          </section>
        )}

        {/* ── 4 · Colors (role-grouped) ── */}
        {hasColors && (
          <section id="colors" className="mt-6 scroll-mt-24">
            <Card title={p.colorsTitle}>
              <ColorGroups colors={colors} locale={typedLocale} />
            </Card>
          </section>
        )}

        {/* Sponsored slot (free users only; server-decided). */}
        <div className="mt-6">
          <AdSlot locale={typedLocale} variant="row" />
        </div>

        {/* ── 5 · Typography ── */}
        {hasFonts && (
          <section id="type" className="mt-6 scroll-mt-24">
            <SectionHeader title={p.typeTitle} />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {fonts.map((font) => (
                <FontSpecimen
                  key={font.id}
                  font={font}
                  isAr={isAr}
                  labels={{
                    brandFont: p.brandFont,
                    getFont: p.getFont,
                    referenceNote: p.fontReference,
                    weightsLabel: p.fontWeights,
                    foundryLabel: p.fontFoundry,
                    licenseLabel: p.fontLicense,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 6 · Brand history (full timeline + archive) ── */}
        {hasHistory && (
          <section id="history" className="mt-8 scroll-mt-24">
            <SectionHeader
              title={p.historyTitle}
              action={
                hasEvolution ? (
                  <Link
                    href={compareHref}
                    className="text-[13px] font-semibold text-link hover:underline"
                  >
                    {dict.brand.compare} →
                  </Link>
                ) : undefined
              }
            />
            {hasTimeline && (
              <Card>
                <BrandTimeline
                  entries={timeline}
                  locale={typedLocale}
                  color={brand.primary_color}
                />
              </Card>
            )}

            {hasArchive && (
              <div className="mt-6">
                <p className="label mb-3 flex items-center">
                  <Badge kind="archived" className="me-2" />
                  {dict.brand.archiveNote}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedAssets.map((asset) => {
                    const typeLabel =
                      ASSET_TYPE_LABELS[asset.asset_type]?.[
                        isAr ? "ar" : "en"
                      ] ?? asset.asset_type;
                    return (
                      <AssetTile
                        key={asset.id}
                        name={`${
                          (isAr ? asset.name_ar : asset.name_en) || typeLabel
                        }${asset.era ? ` · ${asset.era}` : ""}`}
                        domain={brand.website}
                        initials={brand.initials}
                        color={brand.primary_color}
                        ground="brand"
                        archived
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── 7 · In the wild ── */}
        {hasApplications && (
          <section id="applications" className="mt-8 scroll-mt-24">
            <SectionHeader title={p.applicationsTitle} />
            <ApplicationGrid
              applications={applications}
              domain={brand.website}
              initials={brand.initials}
              color={brand.primary_color}
              isAr={isAr}
              placeholderLabel={p.applicationsPlaceholder}
            />
          </section>
        )}

        {/* ── 8 · Company / About (long content, moved to the end) ── */}
        {hasAbout && (
          <section id="about" className="mt-8 scroll-mt-24">
            <SectionHeader title={p.aboutTitle} />
            <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.5fr_1fr]">
              <Card>
                {summary && (
                  <p className="max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed text-ink">
                    {summary}
                  </p>
                )}
                {voice && (
                  <div className="mt-5 border-t border-line pt-5">
                    <h4 className="label mb-2">{p.voiceTitle}</h4>
                    <p className="max-w-[68ch] text-[14px] leading-relaxed text-ink">
                      {voice}
                    </p>
                  </div>
                )}
                {creditText && (
                  <div className="mt-5 border-t border-line pt-5">
                    <CreditLine
                      creditText={creditText}
                      sourceUrl={brand.credit_source_url}
                      sourceLabel={p.source}
                    />
                  </div>
                )}
              </Card>

              <Card title={p.facts}>
                <dl className="flex flex-col gap-3">
                  {brand.founded_year && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="label">{p.factFounded}</dt>
                      <dd className="tnum text-[14px] font-semibold text-ink">
                        {brand.founded_year}
                      </dd>
                    </div>
                  )}
                  {brand.region && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="label">{p.factRegion}</dt>
                      <dd className="text-[14px] font-semibold text-ink">
                        {brand.region}
                      </dd>
                    </div>
                  )}
                  {sectorName && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="label">{p.factSector}</dt>
                      <dd className="text-end text-[14px] font-semibold text-ink">
                        {sectorName}
                      </dd>
                    </div>
                  )}
                  {brand.website && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="label">{p.factWebsite}</dt>
                      <dd className="min-w-0 text-end">
                        <a
                          href={
                            brand.website.startsWith("http")
                              ? brand.website
                              : `https://${brand.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-[14px] font-semibold text-link hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                        >
                          {p.visitWebsite}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            </div>
          </section>
        )}

        {/* Honest global empty — only when the brand has no content at all. */}
        {!hasAssets &&
          !hasColors &&
          !hasFonts &&
          !hasHistory &&
          !hasApplications &&
          !hasAbout && (
            <div className="mt-6">
              <StateBlock
                state="empty"
                icon="📭"
                message={dict.brand.noAssets}
              />
            </div>
          )}
      </main>
    </>
  );
}
