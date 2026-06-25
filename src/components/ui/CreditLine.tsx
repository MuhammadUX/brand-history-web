import React from "react";
import { cn } from "./cn";

export interface CreditLineProps {
  /** "Identity by {label}" — already-composed credit text (designer / agency). */
  creditText?: React.ReactNode;
  /** Optional source URL shown as a gold "source" link after the credit. */
  sourceUrl?: string | null;
  sourceLabel?: string;
  /** Optional last-updated string (already formatted + prefixed). */
  lastUpdated?: React.ReactNode;
  className?: string;
}

/**
 * CreditLine — a compact provenance row under the hero: "Identity by …" plus an
 * optional source link and a last-updated note. Items are separated by a hairline
 * dot. Renders nothing when there is no credit and no last-updated (honest empty).
 * Server component.
 */
export function CreditLine({
  creditText,
  sourceUrl,
  sourceLabel = "source",
  lastUpdated,
  className,
}: CreditLineProps) {
  if (!creditText && !lastUpdated) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted",
        className,
      )}
    >
      {creditText ? <span className="text-ink">{creditText}</span> : null}
      {creditText && sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-link hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {sourceLabel} ↗
        </a>
      ) : null}
      {(creditText || sourceUrl) && lastUpdated ? (
        <span aria-hidden="true" className="text-line">
          ·
        </span>
      ) : null}
      {lastUpdated ? <span>{lastUpdated}</span> : null}
    </p>
  );
}

export default CreditLine;
