import { FilterChip } from "@/components/ui";
import type { Locale, Sector } from "@/lib/types";

interface SectorChipsProps {
  sectors: Sector[];
  locale: Locale;
  /** Base path (after locale), e.g. "browse" or "search". */
  basePath: string;
  /** Currently active sector slug, or undefined for "all". */
  active?: string;
  /** Extra querystring params to preserve, e.g. { q: "aramco" }. */
  extraParams?: Record<string, string>;
  allLabel: string;
}

function buildHref(
  locale: Locale,
  basePath: string,
  sectorSlug: string | undefined,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
  }
  if (sectorSlug) params.set("sector", sectorSlug);
  const qs = params.toString();
  return `/${locale}/${basePath}${qs ? `?${qs}` : ""}`;
}

/**
 * SectorChips — The Library facet row of sector filters. Same data contract
 * and href logic as before; rendered with the Library FilterChip.
 */
export default function SectorChips({
  sectors,
  locale,
  basePath,
  active,
  extraParams,
  allLabel,
}: SectorChipsProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <FilterChip
          href={buildHref(locale, basePath, undefined, extraParams)}
          active={!active}
          aria-current={!active ? "true" : undefined}
        >
          {allLabel}
        </FilterChip>
      </li>
      {sectors.map((s) => {
        const isActive = active === s.slug;
        return (
          <li key={s.id}>
            <FilterChip
              href={buildHref(locale, basePath, s.slug, extraParams)}
              active={isActive}
              aria-current={isActive ? "true" : undefined}
            >
              {locale === "ar" ? s.name_ar : s.name_en}
            </FilterChip>
          </li>
        );
      })}
    </ul>
  );
}
