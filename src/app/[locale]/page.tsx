import React from "react";
import { notFound } from "next/navigation";
import {
  Button,
  Card,
  SectionHeader,
  FilterChip,
  BrandCard,
  BrandGrid,
  BrandRail,
  Badge,
  BrandMark,
} from "@/components/ui";
import FavoriteButton from "@/components/FavoriteButton";
import {
  getBrands,
  getSectors,
  getTrendingBrands,
  getRecentlyUpdatedBrands,
} from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Brand, Locale } from "@/lib/types";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildMetadata({
    locale,
    pathAfterLocale: "",
    title: `${dict.brandName} — ${dict.home.heroTitle}`,
    description: dict.home.heroSubtitle,
  });
}

function brandMeta(brand: Brand, isAr: boolean): string {
  const sector =
    brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
  return [sector, brand.region].filter(Boolean).join(" · ");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const isAr = typedLocale === "ar";

  const [brands, sectors, trending, recent, favCtx] = await Promise.all([
    getBrands(),
    getSectors(),
    getTrendingBrands(8),
    getRecentlyUpdatedBrands(8),
    getFavoritesContext(),
  ]);
  const favSet = new Set(favCtx.favoriteIds);
  const feature = trending[0] ?? brands[0];

  function card(brand: Brand) {
    const name = isAr ? brand.name_ar : brand.name_en;
    return (
      <BrandCard
        key={brand.id}
        name={name}
        meta={brandMeta(brand, isAr)}
        initials={brand.initials}
        domain={brand.website}
        color={brand.primary_color}
        href={`/${typedLocale}/brand/${brand.slug}`}
        verified={brand.is_verified}
      >
        <FavoriteButton
          brandId={brand.id}
          brandName={name}
          locale={typedLocale}
          initialFavorited={favSet.has(brand.id)}
          initialAuthed={favCtx.isAuthed}
          variant="icon"
        />
      </BrandCard>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-content px-6">
      {/* ── Editorial hero ── */}
      <section className="pb-7 pt-14">
        <div className="label mb-3.5">{dict.home.discoverSub}</div>
        <h1 className="max-w-[14ch] text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-3.5 max-w-[52ch] text-[17px] text-muted">
          {dict.home.heroSubtitle}
        </p>

        <form
          action={`/${typedLocale}/search`}
          method="get"
          role="search"
          className="mt-6 flex h-[60px] max-w-[560px] items-center gap-3 rounded-pill border border-line bg-surface ps-[22px] pe-2 shadow-lift"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            name="q"
            placeholder={dict.home.heroSearchPlaceholder}
            aria-label={dict.nav.searchAria}
            className="h-full w-full border-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
          />
          <Button type="submit" variant="primary" className="shrink-0">
            {dict.home.searchButton}
          </Button>
        </form>

        {sectors.length > 0 && (
          <div className="mt-[18px]">
            <div className="label mb-2.5">{dict.home.sectors}</div>
            <ul className="flex flex-wrap gap-2">
              {sectors.map((s) => (
                <li key={s.id}>
                  <FilterChip href={`/${typedLocale}/browse?sector=${s.slug}`}>
                    {isAr ? s.name_ar : s.name_en}
                  </FilterChip>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Brand of the week ── */}
      {feature && (
        <section className="py-2">
          <SectionHeader
            title={dict.discover.brandOfWeek}
            actionHref={`/${typedLocale}/brand/${feature.slug}`}
            actionLabel={`${dict.discover.viewBrand} →`}
          />
          <FeatureCard brand={feature} locale={typedLocale} isAr={isAr} dict={dict} />
        </section>
      )}

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <section className="py-2">
          <SectionHeader
            title={dict.discover.trending}
            actionHref={`/${typedLocale}/browse`}
            actionLabel={`${dict.browse.title} →`}
          />
          <BrandRail>{trending.map(card)}</BrandRail>
        </section>
      )}

      {/* ── Recently updated ── */}
      {recent.length > 0 && (
        <section className="py-2">
          <SectionHeader
            title={dict.discover.recentlyUpdated}
            actionHref={`/${typedLocale}/browse`}
            actionLabel={`${dict.browse.title} →`}
          />
          <BrandRail>{recent.map(card)}</BrandRail>
        </section>
      )}

      {/* ── Discover — full grid ── */}
      <section className="py-6">
        <SectionHeader title={dict.home.discover} />
        <BrandGrid>{brands.map(card)}</BrandGrid>
      </section>
    </main>
  );
}

function FeatureCard({
  brand,
  locale,
  isAr,
  dict,
}: {
  brand: Brand;
  locale: Locale;
  isAr: boolean;
  dict: ReturnType<typeof getDictionary>;
}) {
  const name = isAr ? brand.name_ar : brand.name_en;
  const altName = isAr ? brand.name_en : brand.name_ar;
  const summary = isAr ? brand.summary_ar : brand.summary_en;
  const sector =
    brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
  const metaLine = [
    sector,
    brand.founded_year ? `${dict.brand.founded} ${brand.founded_year}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={`/${locale}/brand/${brand.slug}`}
      style={{ "--brand": brand.primary_color } as React.CSSProperties}
      className="relative grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:grid-cols-[200px_1fr]"
    >
      <div className="brand-rule absolute inset-x-0 top-0 h-2" />
      <div className="brand-tile flex items-center justify-center self-stretch border-b border-line p-6 sm:border-b-0 sm:border-e">
        <BrandMark
          domain={brand.website}
          initials={brand.initials}
          color={brand.primary_color}
          size="xl"
          className="border-0 bg-transparent"
        />
      </div>
      <div className="p-7">
        {metaLine && <div className="label mb-2">{metaLine}</div>}
        <h3 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          {name}
        </h3>
        {altName && (
          <div className="font-arabic mb-3 mt-0.5 text-[16px] text-muted">
            {altName}
          </div>
        )}
        {brand.is_verified && <Badge kind="verified" />}
        {summary && (
          <p className="mt-3 max-w-[60ch] text-[14px] text-muted">{summary}</p>
        )}
      </div>
    </a>
  );
}
