import React from "react";
import { cn } from "./cn";

/**
 * Footer · Concept A colophon. One per page, bottom. Title + catalogue line +
 * nav + copyright, anchored under a 1px ink top rule. Mono tones throughout.
 */

export interface FooterProps {
  title?: string;
  /** Mono catalogue line, e.g. "BH·ARCHIVE / 1.0.0". */
  catalogue?: string;
  nav?: React.ReactNode;
  copyright?: string;
  className?: string;
}

export function Footer({
  title,
  catalogue,
  nav,
  copyright,
  className,
}: FooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-3",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        {title ? <span className="font-display text-ink">{title}</span> : null}
        {catalogue ? (
          <span className="label-mono text-metadata tabular-nums" dir="auto">
            {catalogue}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-1">
        {nav ? <div className="label-mono text-ink">{nav}</div> : null}
        {copyright ? (
          <span className="label-mono text-metadata" dir="auto">
            {copyright}
          </span>
        ) : null}
      </div>
    </footer>
  );
}
