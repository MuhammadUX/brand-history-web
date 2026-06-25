import React from "react";
import { notFound } from "next/navigation";
import {
  Button,
  Badge,
  Card,
  Field,
  Select,
  StateBlock,
  BrandMark,
} from "@/components/ui";
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
      <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
        <StateBlock
          state="empty"
          icon="🗓️"
          title={dict.compare.notEnoughTitle}
          message={dict.compare.notEnoughBody}
          action={
            <Button
              href={`/${typedLocale}/brand/${brand.slug}`}
              variant="primary"
              size="sm"
            >
              {dict.compare.back}
            </Button>
          }
        />
      </main>
    );
  }

  const { a, b } = await searchParams;
  const oldest = timeline[0];
  const newest = timeline[timeline.length - 1];
  const left = timeline.find((e) => e.id === a) ?? oldest;
  let right = timeline.find((e) => e.id === b) ?? newest;
  if (right.id === left.id) {
    right = timeline.find((e) => e.id !== left.id) ?? newest;
  }

  function renderColumn(entry: TimelineEntry, heading: string) {
    const title = isAr ? entry.title_ar : entry.title_en;
    const desc = isAr ? entry.description_ar : entry.description_en;
    return (
      <div
        style={{ "--brand": brand.primary_color } as React.CSSProperties}
        className="relative flex flex-col items-start gap-4 overflow-hidden rounded-lg border border-line bg-surface p-6 shadow-card"
      >
        <div className="brand-rule absolute inset-x-0 top-0 h-2" />
        <p className="label mt-1">{heading}</p>
        <BrandMark
          domain={brand.website}
          initials={brand.initials}
          color={brand.primary_color}
          size="lg"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="tnum text-[28px] font-extrabold leading-none tracking-[-0.02em] text-brand">
            {entry.year}
          </span>
          {entry.category && <Badge kind="neutral">{entry.category}</Badge>}
        </div>
        <h3 className="text-[18px] font-bold leading-tight text-ink">{title}</h3>
        {desc && (
          <p className="text-[14px] leading-relaxed text-muted">{desc}</p>
        )}
      </div>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-content px-6 py-8">
      <header className="mb-2">
        <a
          href={`/${typedLocale}/brand/${brand.slug}`}
          className="text-[13px] font-semibold text-link hover:underline"
        >
          ← {dict.compare.back}
        </a>
      </header>
      <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        {dict.compare.title(name)}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">
        {dict.compare.subtitle}
      </p>

      {/* Era pickers */}
      <Card className="mt-6">
        <form
          method="get"
          className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field label={dict.compare.pickLeft} htmlFor="a">
            <Select id="a" name="a" defaultValue={left.id}>
              {timeline.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.year} — {isAr ? e.title_ar : e.title_en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={dict.compare.pickRight} htmlFor="b">
            <Select id="b" name="b" defaultValue={right.id}>
              {timeline.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.year} — {isAr ? e.title_ar : e.title_en}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="primary">
            {dict.compare.update}
          </Button>
        </form>
      </Card>

      {/* Side by side */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderColumn(left, dict.compare.pickLeft)}
        {renderColumn(right, dict.compare.pickRight)}
      </div>
    </main>
  );
}
