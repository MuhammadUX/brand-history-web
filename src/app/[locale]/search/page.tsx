import { notFound } from "next/navigation";
import {
  SectionHeader,
  Field,
  Input,
  Button,
  FacetRail,
  FacetGroup,
  FilterChip,
  BrandGrid,
  BrandCard,
  StateBlock,
} from "@/components/ui";
import FavoriteButton from "@/components/FavoriteButton";
import { searchBrands, getSectors } from "@/lib/data";
import { getFavoritesContext } from "@/lib/favorites";
import { getDictionary, isLocale } from "@/i18n";
import type { Brand, Locale } from "@/lib/types";
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
  const favSet = new Set(favCtx.favoriteIds);

  function sectorHref(slug?: string): string {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (slug) sp.set("sector", slug);
    return `/${typedLocale}/search?${sp.toString()}`;
  }

  function card(brand: Brand) {
    const name = isAr ? brand.name_ar : brand.name_en;
    const sectorName =
      brand.sectors && (isAr ? brand.sectors.name_ar : brand.sectors.name_en);
    const meta = [sectorName, brand.region].filter(Boolean).join(" · ");
    return (
      <BrandCard
        key={brand.id}
        name={name}
        meta={meta || undefined}
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
      {/* ── Search field ── */}
      <section className="pb-2">
        <SectionHeader title={dict.search.promptTitle} as="h1" />
        <form
          action={`/${typedLocale}/search`}
          method="get"
          role="search"
          className="flex max-w-xl items-end gap-2.5"
        >
          <Field
            label={dict.search.promptTitle}
            htmlFor="search-q"
            className="flex-1"
          >
            <Input
              id="search-q"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={dict.search.promptBody}
              aria-label={dict.search.promptTitle}
            />
          </Field>
          <Button type="submit" variant="primary">
            {dict.home.searchButton}
          </Button>
        </form>
      </section>

      {query ? (
        <section className="py-6">
          {/* Query echo + result count */}
          <SectionHeader
            title={dict.search.resultsFor(query)}
            as="h2"
            kicker={dict.search.count(results.length)}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
            {/* Facets (sector — the wired filter) */}
            <FacetRail aria-label={dict.search.allSectors}>
              <FacetGroup label={dict.nav.sectors}>
                <FilterChip
                  href={sectorHref()}
                  active={!sector}
                  aria-current={!sector ? "true" : undefined}
                >
                  {dict.search.allSectors}
                </FilterChip>
                {sectors.map((s) => {
                  const active = sector === s.slug;
                  return (
                    <FilterChip
                      key={s.id}
                      href={sectorHref(s.slug)}
                      active={active}
                      aria-current={active ? "true" : undefined}
                    >
                      {isAr ? s.name_ar : s.name_en}
                    </FilterChip>
                  );
                })}
              </FacetGroup>
            </FacetRail>

            {/* Results */}
            <div>
              {results.length > 0 ? (
                <BrandGrid>{results.map(card)}</BrandGrid>
              ) : (
                <StateBlock
                  state="empty"
                  icon="🔍"
                  title={dict.search.emptyTitle}
                  message={dict.search.emptyBody}
                  action={
                    <Button
                      href={`/${typedLocale}/suggest`}
                      variant="ghost"
                      size="sm"
                    >
                      {dict.search.suggest}
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-6">
          <StateBlock
            state="empty"
            icon="🔎"
            title={dict.search.promptTitle}
            message={dict.search.promptBody}
          />
        </section>
      )}
    </main>
  );
}
