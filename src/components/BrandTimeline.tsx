"use client";

import React from "react";
import { MetaStrip, Tag, TypeOn } from "@/components/ds";
import { useDevelopIn } from "@/lib/motion";
import type { Locale, TimelineEntry } from "@/lib/types";

/**
 * BrandTimeline (M6) — strata log. Each era is a stratum plate that develops in
 * top→down as it enters view (.mo-develop via useDevelopIn, staggered by depth).
 * The year types on (TypeOn). A citation line renders as a MetaStrip footnote.
 */
export default function BrandTimeline({
  entries,
  locale,
}: {
  entries: TimelineEntry[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  return (
    <ol className="mt-5 flex flex-col">
      {entries.map((entry, i) => (
        <Stratum key={entry.id} entry={entry} index={i} isAr={isAr} />
      ))}
    </ol>
  );
}

function Stratum({
  entry,
  index,
  isAr,
}: {
  entry: TimelineEntry;
  index: number;
  isAr: boolean;
}) {
  const { ref, developed } = useDevelopIn<HTMLLIElement>();
  const title = isAr ? entry.title_ar : entry.title_en;
  const desc = isAr ? entry.description_ar : entry.description_en;

  return (
    <li
      ref={ref}
      className={[
        "grid grid-cols-[88px_1fr] gap-3 border-b border-scaffold py-4",
        "last:border-b-0",
        developed ? "mo-develop" : "",
      ].join(" ")}
      style={{ "--cell-index": index } as React.CSSProperties}
    >
      {/* Year column — types on, tabular */}
      <div className="border-e border-hairline pe-3 text-end">
        <TypeOn
          as="span"
          text={String(entry.year)}
          className="block font-display text-2xl leading-none text-ink tabular-nums"
        />
      </div>

      {/* Stratum body */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg leading-tight text-ink">
            {title}
          </h3>
          {entry.category && <Tag kind="filter">{entry.category}</Tag>}
        </div>
        {desc && (
          <p className="mt-1 font-mono text-[13px] leading-6 text-ink-700">
            {desc}
          </p>
        )}
        {/* Citation footnote */}
        <MetaStrip
          className="mt-2"
          items={[`STRATUM ${String(index + 1).padStart(2, "0")}`, `Y·${entry.year}`]}
        />
      </div>
    </li>
  );
}
