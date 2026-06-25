import React from "react";
import Link from "next/link";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";
import { Badge } from "./Badge";

export interface BrandCardProps {
  name: React.ReactNode;
  /** Meta line, e.g. "Energy · Saudi Arabia". */
  meta?: React.ReactNode;
  initials: string;
  domain?: string | null;
  color?: string | null;
  /** Profile href. */
  href: string;
  verified?: boolean;
  /** Layout: "tile" (rail/grid, stacked) or "row" (compact horizontal). */
  layout?: "tile" | "row";
  /** Overlay slot, e.g. a FavoriteButton in the top corner. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * BrandCard — the atom of every grid/shelf. Logo tile on a softly brand-tinted
 * ground + display name + meta + optional ✓ Verified. Hover lift. Links to the
 * brand profile. The `children` slot rides the top-end corner (favorite).
 */
export function BrandCard({
  name,
  meta,
  initials,
  domain,
  color,
  href,
  verified = false,
  layout = "tile",
  children,
  className,
}: BrandCardProps) {
  return (
    <div className={cn("group relative", className)}>
      {children && (
        <div className="absolute end-2.5 top-2.5 z-10">{children}</div>
      )}
      <Link
        href={href}
        className={cn(
          "flex rounded-lg border border-line bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:border-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link motion-reduce:hover:translate-y-0",
          layout === "tile"
            ? "flex-col gap-3 p-4 text-start"
            : "items-center gap-3.5 p-3.5",
        )}
      >
        {layout === "tile" ? (
          <div className="flex h-16 items-center justify-center brand-tile rounded-md" style={{ "--brand": color || undefined } as React.CSSProperties}>
            <BrandMark domain={domain} initials={initials} color={color} size="md" className="border-0 bg-transparent" />
          </div>
        ) : (
          <BrandMark domain={domain} initials={initials} color={color} size="md" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold leading-tight text-ink">
              {name}
            </span>
            {verified && <Badge kind="verified" className="px-1 py-0">✓</Badge>}
          </div>
          {meta && (
            <div className="mt-0.5 truncate text-[11.5px] text-muted">{meta}</div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default BrandCard;
