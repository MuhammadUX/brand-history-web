import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import BrandGrid from "@/components/BrandGrid";
import SectorChips from "@/components/SectorChips";
import { searchBrands, getSectors } from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; sector?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const { q, sector } = await searchParams;
  const query = (q ?? "").trim();
  const [results, sectors, favCtx] = await Promise.all([
    query ? searchBrands(query, sector) : Promise.resolve([]),
    getSectors(),
    getFavoritesContext(),
  ]);

  return (
    <>
      <TopNav locale={typedLocale} pathAfterLocale="search" />
      <main className="mx-auto max-w-container px-4 py-10 sm:px-6">
        {!query ? (
          <div className="rounded-card border border-border bg-surface p-10 text-center">
            <h1 className="text-xl font-semibold text-ink">
              {dict.search.promptTitle}
            </h1>
            <p className="mt-2 text-sm text-secondary">{dict.search.promptBody}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {dict.search.resultsFor(query)}
              </h1>
              <p className="mt-1 text-sm text-secondary">
                {dict.search.count(results.length)}
              </p>
            </div>

            <div className="mb-8">
              <SectorChips
                sectors={sectors}
                locale={typedLocale}
                basePath="search"
                active={sector}
                extraParams={{ q: query }}
                allLabel={dict.search.allSectors}
              />
            </div>

            {results.length > 0 ? (
              <BrandGrid
                brands={results}
                locale={typedLocale}
                favoriteIds={favCtx.favoriteIds}
                isAuthed={favCtx.isAuthed}
              />
            ) : (
              <div className="rounded-card border border-border bg-surface p-10 text-center">
                <h2 className="text-lg font-semibold text-ink">
                  {dict.search.emptyTitle}
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  {dict.search.emptyBody}
                </p>
                <Link
                  href={`/${typedLocale}/suggest`}
                  className="mt-5 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {dict.search.suggest}
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
