import React from "react";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";
import type { BrandApplication } from "@/lib/types";

export interface ApplicationGridProps {
  applications: BrandApplication[];
  /** Brand identity for the mark fallback ground. */
  domain?: string | null;
  initials: string;
  color?: string | null;
  isAr?: boolean;
  /** Honest placeholder framing label, e.g. "Reference mockup". */
  placeholderLabel: string;
  className?: string;
}

function Tile({
  app,
  domain,
  initials,
  color,
  isAr,
  placeholderLabel,
}: {
  app: BrandApplication;
  domain?: string | null;
  initials: string;
  color?: string | null;
  isAr?: boolean;
  placeholderLabel: string;
}) {
  const caption = (isAr ? app.caption_ar : app.caption_en) || app.caption_en;
  const hasImage = Boolean(app.image_url);

  // Governed ground: cap a custom bg_color via the brand-tint mix so the tile
  // never becomes a full-bleed brand-color block. Falls back to the brand tile.
  const groundStyle: React.CSSProperties = app.bg_color
    ? {
        backgroundColor: `color-mix(in srgb, ${app.bg_color} 12%, #fff)`,
        "--brand": color || undefined,
      } as React.CSSProperties
    : ({ "--brand": color || undefined } as React.CSSProperties);

  return (
    <figure className="overflow-hidden rounded-md border border-line bg-surface">
      <div
        style={groundStyle}
        className={cn(
          "relative flex h-40 items-center justify-center",
          !app.bg_color && "brand-tile",
        )}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={app.image_url!}
            alt={caption || app.context}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <BrandMark
              domain={domain}
              initials={initials}
              color={color}
              size="md"
            />
            <span className="absolute end-2 top-2 rounded-pill border border-line bg-surface/80 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-muted">
              {placeholderLabel}
            </span>
          </>
        )}
      </div>
      <figcaption className="border-t border-line px-3.5 py-2.5">
        <p className="text-[12px] font-bold uppercase tracking-[0.03em] text-ink">
          {app.context}
        </p>
        {caption ? (
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {caption}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

/**
 * ApplicationGrid — "In the wild": a grid of brand-application tiles. Each tile
 * uses a governed/capped `bg_color` ground (never full-bleed), the brand mark
 * (or `image_url` when present) plus a context label and caption, with honest
 * placeholder framing for tiles that have no real photo. Renders nothing when
 * there are no applications. Server component.
 */
export function ApplicationGrid({
  applications,
  domain,
  initials,
  color,
  isAr = false,
  placeholderLabel,
  className,
}: ApplicationGridProps) {
  if (applications.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {applications.map((app) => (
        <Tile
          key={app.id}
          app={app}
          domain={domain}
          initials={initials}
          color={color}
          isAr={isAr}
          placeholderLabel={placeholderLabel}
        />
      ))}
    </div>
  );
}

export default ApplicationGrid;
