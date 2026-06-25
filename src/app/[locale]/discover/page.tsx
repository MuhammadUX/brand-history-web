import Link from "next/link";
import { notFound } from "next/navigation";
import DsBrandGrid from "@/components/DsBrandGrid";
import { catalogueCode } from "@/components/DsBrandCard";
import AdSlot from "@/components/AdSlot";
import {
  Shell,
  SectionHeader,
  Badge,
  DitherPlate,
} from "@/components/ds";
import { getTrendingBrands, getRecentlyUpdatedBrands } from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
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

  const featured = trending[0];
  const featuredName = featured
    ? isAr
      ? featured.name_ar
      : featured.name_en
    : "";
  const featuredSummary = featured
    ? isAr
      ? featured.summary_ar
      : featured.summary_en
    : null;
  const featuredSector =
    featured?.sectors && (isAr ? featured.sectors.name_ar : featured.sectors.name_en);

  return (
    <main id="main-content">
      <Shell>
        {/* Header */}
        <section className="pb-6">
          <h1 className="font-display text-[32px] leading-tight text-ink">
            {dict.discover.title}
          </h1>
          <p className="mt-3 max-w-2xl font-mono text-[15px] leading-6 text-ink-700">
            {dict.discover.subtitle}
          </p>
        </section>

        {/* Brand of the week — single hero specimen plate + museum caption.
            DitherPlate, DS Badge, one primary CTA. */}
        {featured && (
          <section className="py-6">
            <SectionHeader
              index="01"
              title={dict.discover.brandOfWeek}
              as="h2"
            />
            <div className="mt-5 flex flex-col gap-6 border border-hairline bg-surface p-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <DitherPlate
                  initials={featured.initials}
                  size="lg"
                  code={catalogueCode(featured.slug || featured.id)}
                  develop={false}
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl leading-tight text-ink">
                    {featuredName}
                  </h3>
                  {featured.is_verified && <Badge kind="verified" />}
                </div>
                {(featuredSector || featured.region) && (
                  <p className="mt-1 font-mono text-[11px] text-metadata">
                    {[featuredSector, featured.region].filter(Boolean).join(" · ")}
                  </p>
                )}
                {featuredSummary && (
                  <p className="mt-3 max-w-2xl font-mono text-[15px] leading-6 text-ink-700">
                    {featuredSummary}
                  </p>
                )}
                <div className="mt-6">
                  <Link
                    href={`/${typedLocale}/brand/${featured.slug}`}
                    className="mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
                  >
                    {dict.discover.viewBrand}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trending */}
        <section className="py-6">
          <SectionHeader
            index="02"
            title={dict.discover.trending}
            as="h2"
            meta={`N=${trending.length}`}
          />
          <p className="mt-1 font-mono text-[11px] text-metadata">
            {dict.discover.trendingSub}
          </p>
          <div className="mt-5">
            <DsBrandGrid
              brands={trending}
              locale={typedLocale}
              favoriteIds={favCtx.favoriteIds}
              isAuthed={favCtx.isAuthed}
            />
          </div>
        </section>

        {/* Sponsored slot between rows (free users only; server-decided) */}
        <div className="py-6">
          <AdSlot locale={typedLocale} variant="row" />
        </div>

        {/* Recently updated */}
        <section className="py-6">
          <SectionHeader
            index="03"
            title={dict.discover.recentlyUpdated}
            as="h2"
            meta={`N=${recent.length}`}
          />
          <p className="mt-1 font-mono text-[11px] text-metadata">
            {dict.discover.recentlyUpdatedSub}
          </p>
          <div className="mt-5">
            <DsBrandGrid
              brands={recent}
              locale={typedLocale}
              favoriteIds={favCtx.favoriteIds}
              isAuthed={favCtx.isAuthed}
            />
          </div>
        </section>
      </Shell>
    </main>
  );
}
