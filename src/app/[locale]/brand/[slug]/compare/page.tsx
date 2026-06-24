import Link from "next/link";
import { notFound } from "next/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import LogoTile from "@/components/LogoTile";
import { getBrandBySlug, getTimeline } from "@/lib/data";
import { getDictionary, isLocale } from "@/i18n";
import type { Locale, TimelineEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale = locale as Locale;
  const dict = getDictionary(typedLocale);
  const isAr = typedLocale === "ar";

  const found = await getBrandBySlug(slug);
  if (!found) notFound();
  const brand = found;

  const timeline = await getTimeline(brand.id);
  const name = isAr ? brand.name_ar : brand.name_en;

  // Not enough eras -> explained disabled state.
  if (timeline.length < 2) {
    return (
      <>
        <TopNav locale={typedLocale} />
        <main className="mx-auto max-w-container px-4 py-16 sm:px-6">
          <div className="rounded-card border border-border bg-surface p-10 text-center">
            <h1 className="text-xl font-semibold text-ink">
              {dict.compare.notEnoughTitle}
            </h1>
            <p className="mt-2 text-sm text-secondary">
              {dict.compare.notEnoughBody}
            </p>
            <Link
              href={`/${typedLocale}/brand/${brand.slug}`}
              className="mt-6 inline-flex rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.compare.back}
            </Link>
          </div>
        </main>
        <Footer locale={typedLocale} />
      </>
    );
  }

  const { a, b } = await searchParams;
  const oldest = timeline[0];
  const newest = timeline[timeline.length - 1];
  const left =
    timeline.find((e) => e.id === a) ?? oldest;
  let right = timeline.find((e) => e.id === b) ?? newest;
  if (right.id === left.id) {
    right = timeline.find((e) => e.id !== left.id) ?? newest;
  }

  const selectCls =
    "w-full rounded-btn border border-border bg-page px-3 py-2 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  function renderColumn(entry: TimelineEntry, heading: string) {
    const title = isAr ? entry.title_ar : entry.title_en;
    const desc = isAr ? entry.description_ar : entry.description_en;
    return (
      <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-tertiary">
          {heading}
        </p>
        <LogoTile
          initials={brand.initials}
          color={brand.primary_color}
          name={name}
          size="lg"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-ink">{entry.year}</span>
          {entry.category && (
            <span className="rounded-pill bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-primary">
              {entry.category}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {desc && (
          <p className="text-sm leading-relaxed text-secondary">{desc}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <TopNav locale={typedLocale} />
      <main className="mx-auto max-w-container px-4 py-10 sm:px-6">
        <header className="mb-2">
          <Link
            href={`/${typedLocale}/brand/${brand.slug}`}
            className="text-sm text-primary hover:underline"
          >
            ← {dict.compare.back}
          </Link>
        </header>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {dict.compare.title(name)}
        </h1>
        <p className="mt-1 text-sm text-secondary">{dict.compare.subtitle}</p>

        {/* Era pickers */}
        <form
          method="get"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1.5">
            <label htmlFor="a" className="block text-sm font-medium text-ink">
              {dict.compare.pickLeft}
            </label>
            <select id="a" name="a" defaultValue={left.id} className={selectCls}>
              {timeline.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.year} — {isAr ? e.title_ar : e.title_en}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="b" className="block text-sm font-medium text-ink">
              {dict.compare.pickRight}
            </label>
            <select id="b" name="b" defaultValue={right.id} className={selectCls}>
              {timeline.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.year} — {isAr ? e.title_ar : e.title_en}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex h-[42px] items-center justify-center rounded-btn bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {dict.compare.update}
          </button>
        </form>

        {/* Side by side */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {renderColumn(left, dict.compare.pickLeft)}
          {renderColumn(right, dict.compare.pickRight)}
        </div>
      </main>
      <Footer locale={typedLocale} />
    </>
  );
}
