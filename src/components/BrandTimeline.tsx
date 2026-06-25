import { Timeline, TimelineEvent } from "@/components/ui";
import type { Locale, TimelineEntry } from "@/lib/types";

/**
 * BrandTimeline — The Library vertical brand-evolution chronology. Each entry
 * is a TimelineEvent (big tabular year + title + caption + category tag) on a
 * warm rail. Same data contract as before.
 */
export default function BrandTimeline({
  entries,
  locale,
  color,
}: {
  entries: TimelineEntry[];
  locale: Locale;
  /** Brand primary color — tints the year + node dot (governed accent). */
  color?: string | null;
}) {
  const isAr = locale === "ar";
  return (
    <Timeline orientation="vertical" className="mt-5">
      {entries.map((entry) => (
        <TimelineEvent
          key={entry.id}
          orientation="vertical"
          year={String(entry.year)}
          title={isAr ? entry.title_ar : entry.title_en}
          description={isAr ? entry.description_ar : entry.description_en}
          category={entry.category ?? undefined}
          color={color}
        />
      ))}
    </Timeline>
  );
}
