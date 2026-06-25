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
    "mo-invert inline-flex items-center border px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-label";
  const activeCls = "border-ink bg-ink text-paper";
  const idleCls =
    "border-hairline bg-surface text-ink hover:border-ink hover:bg-ink hover:text-paper";

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
