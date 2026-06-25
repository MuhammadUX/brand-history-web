import { notFound } from "next/navigation";
import DsBrandCard from "@/components/DsBrandCard";
import SectorChips from "@/components/SectorChips";
import { Shell, SectionHeader, StateBlock } from "@/components/ds";
import { getBrands, getSectors } from "@/lib/data";
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
    pathAfterLocale: "browse",
    title: `${dict.browse.title} — ${dict.brandName}`,
    description: dict.browse.subtitle,
  });
}

function groupAlphabetically(
  brands: Brand[],
  locale: Locale
): { letter: string; items: Brand[] }[] {
  const groups = new Map<string, Brand[]>();
  for (const brand of brands) {
    const name = (locale === "ar" ? brand.name_ar : brand.name_en) || "#";
    const first = name.trim().charAt(0).toUpperCase() || "#";
    const letter = /[A-Z؀-ۿ]/.test(first) ? first : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(brand);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], locale === "ar" ? "ar" : "en"))
    .map(([letter, items]) => ({
      letter,
      items: items.sort((a, b) =>
        ((locale === "ar" ? a.name_ar : a.name_en) || "").localeCompare(
          (locale === "ar" ? b.name_ar : b.name_en) || "",
          locale === "ar" ? "ar" : "en"
        )
      ),
    }));
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sector?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);

  const { sector } = await searchParams;
  const [brands, sectors, favCtx] = await Promise.all([
    getBrands(sector),
    getSectors(),
    getFavoritesContext(),
  ]);
  const favSet = new Set(favCtx.favoriteIds);
  const groups = groupAlphabetically(brands, typedLocale);

  return (
    <main id="main-content">
      <Shell>
        <section className="pb-6">
          <h1 className="font-display text-[32px] leading-tight text-ink">
            {dict.browse.title}
          </h1>
          <p className="mt-3 max-w-2xl font-mono text-[15px] leading-6 text-ink-700">
            {dict.browse.subtitle}
          </p>
        </section>

        <div className="mb-4">
          <SectorChips
            sectors={sectors}
            locale={typedLocale}
            basePath="browse"
            active={sector}
            allLabel={dict.browse.allSectors}
          />
        </div>
        <p className="mb-8 font-mono text-[11px] text-metadata">
          {dict.browse.count(brands.length)} · {dict.browse.regionNote}
        </p>

        {groups.length === 0 ? (
          <StateBlock state="empty" message={dict.browse.empty} />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.letter}>
                <SectionHeader
                  title={group.letter}
                  as="h2"
                  meta={`N=${group.items.length}`}
                />
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((brand) => (
                    <DsBrandCard
                      key={brand.id}
                      brand={brand}
                      locale={typedLocale}
                      isFavorited={favSet.has(brand.id)}
                      isAuthed={favCtx.isAuthed}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Shell>
    </main>
  );
}
