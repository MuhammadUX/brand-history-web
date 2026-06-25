import React from "react";
import { notFound } from "next/navigation";
import {
  SectionHeader,
  BrandCard,
  BrandRail,
  Badge,
  BrandMark,
  Button,
} from "@/components/ui";
import FavoriteButton from "@/components/FavoriteButton";
import AdSlot from "@/components/AdSlot";
import { getTrendingBrands, getRecentlyUpdatedBrands } from "@/lib/data";
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
    pathAfterLocale: "discover",
    title: `${dict.discover.title} — ${dict.brandName}`,
    description: dict.discover.subtitle,
  });
}

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const isAr = typedLocale === "ar";

  const [trending, recent, favCtx] = await Promise.all([
    getTrendingBrands(8),
    getRecentlyUpdatedBrands(8),
    getFavoritesContext(),
  ]);
  const favSet = new Set(favCtx.favoriteIds);

  const featured = trending[0];

  function brandMeta(brand: Brand): string {
    const sector =
      brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
    return [sector, brand.region].filter(Boolean).join(" · ");
  }

  function card(brand: Brand) {
    const name = isAr ? brand.name_ar : brand.name_en;
    return (
      <BrandCard
        key={brand.id}
        name={name}
        meta={brandMeta(brand)}
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
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      {/* ── Header ── */}
      <section className="pb-2">
        <div className="label mb-3.5">{dict.discover.subtitle}</div>
        <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
          {dict.discover.title}
        </h1>
      </section>

      {/* ── Brand of the week ── */}
      {featured && (
        <section className="py-6">
          <SectionHeader
            title={dict.discover.brandOfWeek}
            as="h2"
            actionHref={`/${typedLocale}/brand/${featured.slug}`}
            actionLabel={`${dict.discover.viewBrand} →`}
          />
          <FeatureCard brand={featured} locale={typedLocale} isAr={isAr} dict={dict} />
        </section>
      )}

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <section className="py-2">
          <SectionHeader
            title={dict.discover.trending}
            kicker={dict.discover.trendingSub}
            as="h2"
          />
          <BrandRail>{trending.map(card)}</BrandRail>
        </section>
      )}

      {/* Sponsored slot between rows (free users only; server-decided) */}
      <div className="py-6">
        <AdSlot locale={typedLocale} variant="row" />
      </div>

      {/* ── Recently updated ── */}
      {recent.length > 0 && (
        <section className="py-2">
          <SectionHeader
            title={dict.discover.recentlyUpdated}
            kicker={dict.discover.recentlyUpdatedSub}
            as="h2"
          />
          <BrandRail>{recent.map(card)}</BrandRail>
        </section>
      )}
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
  const metaLine = [sector, brand.region].filter(Boolean).join(" · ");

  return (
    <article
      style={{ "--brand": brand.primary_color } as React.CSSProperties}
      className="relative grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-surface shadow-card sm:grid-cols-[200px_1fr]"
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
        <div className="mt-5">
          <Button href={`/${locale}/brand/${brand.slug}`} variant="primary" size="sm">
            {dict.discover.viewBrand}
          </Button>
        </div>
      </div>
    </article>
  );
}
