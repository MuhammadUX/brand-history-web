import Link from "next/link";
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
  extraParams?: Record<string, string>
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

export default function SectorChips({
  sectors,
  locale,
  basePath,
  active,
  extraParams,
  allLabel,
}: SectorChipsProps) {
  const baseCls =
    "inline-flex items-center rounded-pill border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  const activeCls = "border-primary bg-primary text-white";
  const idleCls =
    "border-border bg-surface text-ink hover:border-primary/40 hover:bg-page";

  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <Link
          href={buildHref(locale, basePath, undefined, extraParams)}
          className={`${baseCls} ${!active ? activeCls : idleCls}`}
          aria-current={!active ? "true" : undefined}
        >
          {allLabel}
        </Link>
      </li>
      {sectors.map((s) => {
        const isActive = active === s.slug;
        return (
          <li key={s.id}>
            <Link
              href={buildHref(locale, basePath, s.slug, extraParams)}
              className={`${baseCls} ${isActive ? activeCls : idleCls}`}
              aria-current={isActive ? "true" : undefined}
            >
              {locale === "ar" ? s.name_ar : s.name_en}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
