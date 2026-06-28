import React from "react";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";
import { Badge } from "./Badge";

export interface FormatPillProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormatPill — tiny outlined format tag (SVG/PNG/PDF/EPS) shown in an
 * AssetTile footer. Outline uses currentColor in the gold link tone.
 */
export function FormatPill({ children, className }: FormatPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border border-current px-2 py-[3px] text-[10.5px] font-bold tracking-[0.03em] text-link",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface AssetTileProps {
  name: React.ReactNode;
  /** Asset file format, e.g. "SVG" | "PNG" | "PDF" | "EPS". */
  format?: string;
  /** Uploaded asset image URL. When set, the real image renders on the ground
   *  instead of the BrandMark fallback. */
  imageUrl?: string | null;
  domain?: string | null;
  initials: string;
  color?: string | null;
  ground?: "light" | "dark" | "brand";
  archived?: boolean;
  /** Optional trailing action (e.g. a download Button) in the footer end. */
  action?: React.ReactNode;
  className?: string;
}

const GROUNDS: Record<NonNullable<AssetTileProps["ground"]>, string> = {
  light: "bg-white",
  dark: "bg-[#111]",
  brand: "brand-tile",
};

/**
 * AssetTile — a downloadable brand-asset preview. A 96px ground area centers
 * the brand mark; the footer shows the asset name plus a format pill (or an
 * Archived badge) and an optional action. Server component.
 */
export function AssetTile({
  name,
  format,
  imageUrl,
  domain,
  initials,
  color,
  ground = "light",
  archived = false,
  action,
  className,
}: AssetTileProps) {
  return (
    <div
      style={{ "--brand": color || undefined } as React.CSSProperties}
      className={cn(
        "overflow-hidden rounded-md border border-line bg-surface",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-24 items-center justify-center",
          GROUNDS[ground],
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-16 w-16 object-contain"
          />
        ) : (
          <BrandMark domain={domain} initials={initials} color={color} size="sm" />
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">
          {name}
        </span>
        {archived ? (
          <Badge kind="archived" />
        ) : format ? (
          <FormatPill>{format}</FormatPill>
        ) : null}
        {action ? <span className="ms-auto inline-flex">{action}</span> : null}
      </div>
    </div>
  );
}

export default AssetTile;
