import { notFound } from "next/navigation";
import DsBrandGrid from "@/components/DsBrandGrid";
import { Shell, SectionHeader, CodeChip, Input, Button, Tag, TypeOn } from "@/components/ds";
import { getBrands, getSectors } from "@/lib/data";
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
    pathAfterLocale: "",
    title: `${dict.brandName} — ${dict.home.heroTitle}`,
    description: dict.home.heroSubtitle,
  });
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

  const [brands, sectors, favCtx] = await Promise.all([
    getBrands(),
    getSectors(),
    getFavoritesContext(),
  ]);

  return (
    <main id="main-content">
      <Shell>
        {/* Hero — search is the single focal point. One quiet headline, then a
            generous command-style search field. No internal jargon eyebrow. */}
        <section className="pb-6">
          <TypeOn
            text={dict.home.heroTitle}
            className="text-ink"
            // headline runs long → renders instantly with a solid caret beat
          />
          <p className="mt-3 max-w-2xl font-mono text-[15px] leading-6 text-ink-700">
            {dict.home.heroSubtitle}
          </p>

          <form
            action={`/${typedLocale}/search`}
            method="get"
            role="search"
            className="mt-6 max-w-2xl"
          >
            <label htmlFor="home-q" className="label-mono mb-2 block text-ink">
              [ SEARCH ]
            </label>
            <div className="flex items-stretch gap-2">
              <Input
                id="home-q"
                type="search"
                name="q"
                placeholder={dict.home.heroSearchPlaceholder}
                aria-label={dict.home.heroSearchPlaceholder}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                className="h-12 px-4"
              >
                {dict.home.searchButton}
              </Button>
            </div>
          </form>
        </section>

        {/* Sectors — filter tags */}
        {sectors.length > 0 && (
          <section className="py-6">
            <SectionHeader
              index="01"
              title={dict.home.sectors}
              as="h2"
              meta={`N=${sectors.length}`}
            />
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {sectors.map((s) => (
                <li key={s.id}>
                  <Tag kind="filter">
                    {typedLocale === "ar" ? s.name_ar : s.name_en}
                  </Tag>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Discover — index grid of specimen cards (M1 develop-in) */}
        <section className="py-6">
          <SectionHeader
            index="02"
            title={dict.home.discover}
            as="h2"
            meta={<CodeChip code={`N=${brands.length}`} />}
          />
          <p className="mt-1 font-mono text-[11px] text-metadata">
            {dict.home.discoverSub}
          </p>
          <div className="mt-5">
            <DsBrandGrid
              brands={brands}
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
