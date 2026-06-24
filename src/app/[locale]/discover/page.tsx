import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import BrandGrid from "@/components/BrandGrid";
import LogoTile from "@/components/LogoTile";
import AdSlot from "@/components/AdSlot";
import { getTrendingBrands, getRecentlyUpdatedBrands } from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    <>
      <TopNav locale={typedLocale} pathAfterLocale="discover" />
      <main className="mx-auto max-w-container px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {dict.discover.title}
          </h1>
          <p className="mt-1 text-sm text-secondary">{dict.discover.subtitle}</p>
        </header>

        {/* Brand of the week */}
        {featured && (
          <section className="mb-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-tertiary">
              {dict.discover.brandOfWeek}
            </h2>
            <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
              <LogoTile
                initials={featured.initials}
                color={featured.primary_color}
                name={featuredName}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold tracking-tight text-ink">
                    {featuredName}
                  </h3>
                  {featured.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-verifiedBg px-2.5 py-1 text-xs font-medium text-verifiedText">
                      <span aria-hidden="true">✓</span> {dict.card.verified}
                    </span>
                  )}
                </div>
                {(featuredSector || featured.region) && (
                  <p className="mt-1 text-sm text-secondary">
                    {[featuredSector, featured.region].filter(Boolean).join(" · ")}
                  </p>
                )}
                {featuredSummary && (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
                    {featuredSummary}
                  </p>
                )}
                <Link
                  href={`/${typedLocale}/brand/${featured.slug}`}
                  className="mt-5 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {dict.discover.viewBrand}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Trending */}
        <section className="mb-12">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {dict.discover.trending}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {dict.discover.trendingSub}
            </p>
          </div>
          <BrandGrid
            brands={trending}
            locale={typedLocale}
            favoriteIds={favCtx.favoriteIds}
            isAuthed={favCtx.isAuthed}
          />
        </section>

        {/* Sponsored slot between rows (free users only; server-decided) */}
        <div className="mb-12">
          <AdSlot locale={typedLocale} variant="row" />
        </div>

        {/* Recently updated */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {dict.discover.recentlyUpdated}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {dict.discover.recentlyUpdatedSub}
            </p>
          </div>
          <BrandGrid
            brands={recent}
            locale={typedLocale}
            favoriteIds={favCtx.favoriteIds}
            isAuthed={favCtx.isAuthed}
          />
        </section>
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
