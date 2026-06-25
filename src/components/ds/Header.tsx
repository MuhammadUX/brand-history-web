import React from "react";
import Link from "next/link";
import { cn } from "./cn";

/**
 * Header · Concept A top bar. One per page, top. Wordmark + system line on the
 * start side; EN/ع locale toggle + auth slot on the end. 1px ink bottom rule.
 * Auto-mirrors in RTL via flex + logical props.
 */

export interface HeaderProps {
  /** Brand wordmark. */
  wordmark?: string;
  /** Mono sub-line, e.g. "ARCHIVE · v1". */
  systemLine?: string;
  locale: "en" | "ar";
  /** Locale toggle as navigation: href per locale. */
  localeToggleHref?: { en: string; ar: string };
  /** Locale toggle as action. Used when hrefs are absent. */
  onToggleLocale?: () => void;
  /** Trailing slot, e.g. LOG IN button or account menu. */
  authSlot?: React.ReactNode;
  className?: string;
}

type ToggleEntry = { key: "en" | "ar"; label: string };

const TOGGLES: ToggleEntry[] = [
  { key: "en", label: "EN" },
  { key: "ar", label: "ع" },
];

export function Header({
  wordmark = "BRAND·HISTORY",
  systemLine,
  locale,
  localeToggleHref,
  onToggleLocale,
  authSlot,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-ink pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-ink">{wordmark}</span>
        {systemLine ? (
          <span className="label-mono text-metadata" dir="auto">
            {systemLine}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <div
          className="label-mono flex items-center gap-1"
          role="group"
          aria-label="Language"
        >
          {TOGGLES.map((t, i) => {
            const active = t.key === locale;
            const cls = cn(
              "px-0.5",
              active ? "text-ink" : "text-metadata",
            );
            const node = localeToggleHref ? (
              <Link
                href={localeToggleHref[t.key]}
                lang={t.key}
                aria-current={active ? "true" : undefined}
                className={cls}
              >
                {t.label}
              </Link>
            ) : (
              <button
                type="button"
                lang={t.key}
                aria-pressed={active}
                onClick={onToggleLocale}
                className={cls}
              >
                {t.label}
              </button>
            );
            return (
              <React.Fragment key={t.key}>
                {i > 0 ? (
                  <span aria-hidden="true" className="text-hairline">
                    /
                  </span>
                ) : null}
                {node}
              </React.Fragment>
            );
          })}
        </div>
        {authSlot ? <div className="flex items-center">{authSlot}</div> : null}
      </div>
    </header>
  );
}

/** Spec alias. */
export const TopBar = Header;
