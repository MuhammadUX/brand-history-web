import { notFound } from "next/navigation";
import {
  SectionHeader,
  BrandGrid,
  BrandCard,
  StateBlock,
} from "@/components/ui";
import FavoriteButton from "@/components/FavoriteButton";
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
  const isAr = typedLocale === "ar";

  const { sector } = await searchParams;
  const [brands, sectors, favCtx] = await Promise.all([
    getBrands(sector),
    getSectors(),
    getFavoritesContext(),
  ]);
  const favSet = new Set(favCtx.favoriteIds);
  const groups = groupAlphabetically(brands, typedLocale);

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
      <section className="pb-5">
        <div className="label mb-3.5">{dict.browse.subtitle}</div>
        <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
          {dict.browse.title}
        </h1>
      </section>

      <div className="mb-3">
        <SectorChips
          sectors={sectors}
          locale={typedLocale}
          basePath="browse"
          active={sector}
          allLabel={dict.browse.allSectors}
        />
      </div>
      <p className="label mb-8">
        {dict.browse.count(brands.length)} · {dict.browse.regionNote}
      </p>

      {groups.length === 0 ? (
        <StateBlock state="empty" icon="🗂️" message={dict.browse.empty} />
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.letter}>
              <SectionHeader
                title={
                  <span className="text-[22px] font-extrabold tracking-[-0.02em]">
                    {group.letter}
                  </span>
                }
                as="h2"
              />
              <BrandGrid>{group.items.map(card)}</BrandGrid>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
