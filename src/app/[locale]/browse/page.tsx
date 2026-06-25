import { notFound } from "next/navigation";
import BrandCard from "@/components/BrandCard";
import SectorChips from "@/components/SectorChips";
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
    <>
      <main id="main-content" className="mx-auto max-w-container px-4 py-10 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {dict.browse.title}
          </h1>
          <p className="mt-1 text-sm text-secondary">{dict.browse.subtitle}</p>
        </header>

        <div className="mb-4">
          <SectorChips
            sectors={sectors}
            locale={typedLocale}
            basePath="browse"
            active={sector}
            allLabel={dict.browse.allSectors}
          />
        </div>
        <p className="mb-8 text-xs text-tertiary">
          {dict.browse.count(brands.length)} · {dict.browse.regionNote}
        </p>

        {groups.length === 0 ? (
          <div className="rounded-card border border-border bg-surface p-10 text-center">
            <p className="text-sm text-secondary">{dict.browse.empty}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.letter}>
                <h2 className="mb-4 text-lg font-bold text-primary">
                  {group.letter}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((brand) => (
                    <BrandCard
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
      </main>
    </>
  );
}
