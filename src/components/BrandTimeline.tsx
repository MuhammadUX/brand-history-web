import { Tag } from "@/components/ds";
import type { Locale, TimelineEntry } from "@/lib/types";

/**
 * BrandTimeline (M6) — strata log. Each era is a stratum row that renders
 * static and still (silent luxury): no year typewriter, no per-stratum
 * develop wipe, and no redundant `STRATUM NN` caption — the year is already the
 * large display numeral beside each layer.
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
      {entries.map((entry) => (
        <Stratum key={entry.id} entry={entry} isAr={isAr} />
      ))}
    </ol>
  );
}

function Stratum({
  entry,
  isAr,
}: {
  entry: TimelineEntry;
  isAr: boolean;
}) {
  const title = isAr ? entry.title_ar : entry.title_en;
  const desc = isAr ? entry.description_ar : entry.description_en;

  return (
    <li className="grid grid-cols-[88px_1fr] gap-3 border-b border-scaffold py-4 last:border-b-0">
      {/* Year column — static, tabular */}
      <div className="border-e border-hairline pe-3 text-end">
        <span className="block font-display text-2xl leading-none text-ink tabular-nums">
          {String(entry.year)}
        </span>
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
      </div>
    </li>
  );
}
