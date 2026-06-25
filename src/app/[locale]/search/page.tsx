import Link from "next/link";
import { notFound } from "next/navigation";
import DsBrandGrid from "@/components/DsBrandGrid";
import {
  Shell,
  SectionHeader,
  MetaStrip,
  Input,
  Button,
  Tag,
  StateBlock,
} from "@/components/ds";
import { searchBrands, getSectors } from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale } from "@/lib/types";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; sector?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { q } = await searchParams;
  const dict = getDictionary(locale);
  const query = (q ?? "").trim();
  const title = query
    ? `${dict.search.resultsFor(query)} — ${dict.brandName}`
    : `${dict.search.promptTitle} — ${dict.brandName}`;
  return buildMetadata({
    locale,
    pathAfterLocale: "search",
    title,
    description: dict.search.promptBody,
  });
}

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
  const isAr = typedLocale === "ar";

  const { q, sector } = await searchParams;
  const query = (q ?? "").trim();
  const [results, sectors, favCtx] = await Promise.all([
    query ? searchBrands(query, sector) : Promise.resolve([]),
    getSectors(),
    getFavoritesContext(),
  ]);

  function sectorHref(slug?: string): string {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (slug) sp.set("sector", slug);
    return `/${typedLocale}/search?${sp.toString()}`;
  }

  return (
    <main id="main-content">
      <Shell>
        {/* Command search */}
        <section className="py-8">
          <SectionHeader
            index="00"
            title={dict.search.promptTitle}
            as="h1"
            meta="QUERY"
          />
          <form
            action={`/${typedLocale}/search`}
            method="get"
            role="search"
            className="mt-5 flex max-w-xl items-end gap-2"
          >
            <div className="flex-1">
              <label htmlFor="search-q" className="label-mono mb-1 block text-ink">
                [ SEARCH ]
              </label>
              <Input
                id="search-q"
                type="search"
                name="q"
                defaultValue={query}
                placeholder={dict.search.promptBody}
                aria-label={dict.search.promptTitle}
              />
            </div>
            <Button type="submit" variant="primary">
              {dict.home.searchButton}
            </Button>
          </form>
        </section>

        {query && (
          <section className="py-6">
            <SectionHeader
              title={dict.search.resultsFor(query)}
              as="h2"
              meta={dict.search.count(results.length)}
            />

            {/* Sector filter row */}
            <ul className="mt-4 flex flex-wrap gap-1.5">
              <li>
                <Link href={sectorHref()} aria-current={!sector ? "true" : undefined}>
                  <Tag kind="filter" className={!sector ? "border-ink" : undefined}>
                    {dict.search.allSectors}
                  </Tag>
                </Link>
              </li>
              {sectors.map((s) => {
                const active = sector === s.slug;
                return (
                  <li key={s.id}>
                    <Link
                      href={sectorHref(s.slug)}
                      aria-current={active ? "true" : undefined}
                    >
                      <Tag
                        kind="filter"
                        className={active ? "border-ink bg-scaffold" : undefined}
                      >
                        {isAr ? s.name_ar : s.name_en}
                      </Tag>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              {results.length > 0 ? (
                <DsBrandGrid
                  brands={results}
                  locale={typedLocale}
                  favoriteIds={favCtx.favoriteIds}
                  isAuthed={favCtx.isAuthed}
                />
              ) : (
                <div className="mx-auto max-w-xl">
                  <StateBlock
                    state="empty"
                    title={dict.search.emptyTitle}
                    message={dict.search.emptyBody}
                  />
                  <div className="mt-4 flex justify-center">
                    <Link
                      href={`/${typedLocale}/suggest`}
                      className="mo-invert mo-press inline-flex h-10 items-center justify-center border border-ink px-2 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper"
                    >
                      {dict.search.suggest}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!query && (
          <section className="py-6">
            <MetaStrip items={["BH·ARCHIVE", "AWAITING QUERY"]} />
          </section>
        )}
      </Shell>
    </main>
  );
}
