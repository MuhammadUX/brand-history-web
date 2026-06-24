import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import BrandGrid from "@/components/BrandGrid";
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
    <>
      <TopNav locale={typedLocale} />
      <main id="main-content">
        {/* Hero */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-container px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {dict.home.heroTitle}
              </h1>
              <p className="mt-4 text-lg text-secondary">
                {dict.home.heroSubtitle}
              </p>
              <form
                action={`/${typedLocale}/search`}
                method="get"
                role="search"
                className="mx-auto mt-8 flex max-w-xl items-center gap-2"
              >
                <input
                  type="search"
                  name="q"
                  placeholder={dict.home.heroSearchPlaceholder}
                  aria-label={dict.home.heroSearchPlaceholder}
                  className="w-full rounded-btn border border-border bg-page px-5 py-3.5 text-base text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-btn bg-primary px-6 py-3.5 text-base font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {dict.home.searchButton}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Sectors row */}
        {sectors.length > 0 && (
          <section className="mx-auto max-w-container px-4 pt-12 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">
              {dict.home.sectors}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {sectors.map((s) => (
                <li key={s.id}>
                  <span className="inline-flex items-center rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-ink">
                    {typedLocale === "ar" ? s.name_ar : s.name_en}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Discover */}
        <section className="mx-auto max-w-container px-4 py-12 sm:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              {dict.home.discover}
            </h2>
            <p className="mt-1 text-sm text-secondary">{dict.home.discoverSub}</p>
          </div>
          <BrandGrid
            brands={brands}
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
