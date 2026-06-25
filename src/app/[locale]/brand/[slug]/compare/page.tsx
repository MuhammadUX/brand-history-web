import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Shell,
  Button,
  Badge,
  StateBlock,
} from "@/components/ds";
import { BrandMark } from "@/components/BrandMark";
import { catalogueCode } from "@/components/DsBrandCard";
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
      <main id="main-content">
        <Shell>
          <div className="flex flex-col items-start gap-6">
            <StateBlock
              state="empty"
              title={dict.compare.notEnoughTitle}
              message={dict.compare.notEnoughBody}
              className="w-full"
            />
            <Link
              href={`/${typedLocale}/brand/${brand.slug}`}
              className="mo-invert mo-press inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-ink px-4 font-mono text-[11px] font-medium uppercase tracking-label text-paper hover:border-ink-700 hover:bg-ink-700"
            >
              {dict.compare.back}
            </Link>
          </div>
        </Shell>
      </main>
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
    "h-12 w-full rounded-none border border-hairline bg-surface px-3 font-mono text-[13px] text-ink focus:border-ink focus:outline-none";

  function renderColumn(entry: TimelineEntry, heading: string) {
    const title = isAr ? entry.title_ar : entry.title_en;
    const desc = isAr ? entry.description_ar : entry.description_en;
    return (
      <div className="flex flex-col items-start gap-4 border border-hairline bg-surface p-6">
        <p className="label-mono text-metadata">{heading}</p>
        <BrandMark
          domain={brand.website}
          initials={brand.initials}
          size="lg"
          code={catalogueCode(brand.slug || brand.id)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-2xl leading-none text-ink tabular-nums">
            {entry.year}
          </span>
          {entry.category && <Badge kind="filter">{entry.category}</Badge>}
        </div>
        <h3 className="font-display text-lg leading-tight text-ink">{title}</h3>
        {desc && (
          <p className="font-mono text-[15px] leading-6 text-ink-700">{desc}</p>
        )}
      </div>
    );
  }

  return (
    <main id="main-content">
      <Shell>
        <header className="mb-2">
          <Link
            href={`/${typedLocale}/brand/${brand.slug}`}
            className="label-mono text-metadata hover:text-ink"
          >
            ← {dict.compare.back}
          </Link>
        </header>
        <h1 className="mt-2 font-display text-[32px] leading-tight text-ink">
          {dict.compare.title(name)}
        </h1>
        <p className="mt-3 font-mono text-[15px] leading-6 text-ink-700">
          {dict.compare.subtitle}
        </p>

        {/* Era pickers */}
        <form
          method="get"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="a" className="label-mono text-ink">
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
          <div className="flex flex-col gap-2">
            <label htmlFor="b" className="label-mono text-ink">
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
          <Button type="submit" variant="primary" className="h-12 px-4">
            {dict.compare.update}
          </Button>
        </form>

        {/* Side by side */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderColumn(left, dict.compare.pickLeft)}
          {renderColumn(right, dict.compare.pickRight)}
        </div>
      </Shell>
    </main>
  );
}
