"use client";

import React, { useState } from "react";
import { cn } from "./cn";

export type BrandMarkSize = "sm" | "md" | "lg" | "xl";

/** Outer tile px per size. The logo image sits inset within. */
const TILE: Record<BrandMarkSize, number> = { sm: 48, md: 64, lg: 104, xl: 140 };
const LOGO: Record<BrandMarkSize, number> = { sm: 26, md: 34, lg: 58, xl: 72 };

export interface BrandMarkProps {
  /** Brand website domain, e.g. "aramco.com". When set, the real logo shows. */
  domain?: string | null;
  /** 1–3 char initials for the graceful fallback. */
  initials: string;
  /** Brand primary color — drives the ≤12% tinted ground and initials fallback. */
  color?: string | null;
  size?: BrandMarkSize;
  /** Square tile vs. pill. Default rounded tile. */
  className?: string;
  "aria-label"?: string;
}

/**
 * Resolve a logo URL for a domain. Uses logo.dev when a public token is
 * configured (sharp PNG), otherwise Google's favicon service (no key needed).
 */
export function logoSrc(domain: string, size = 256): string {
  const token = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;
  if (token) {
    return `https://img.logo.dev/${domain}?token=${token}&size=${size}&format=png`;
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

function isLightColor(hex?: string | null): boolean {
  if (!hex) return false;
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
}

/**
 * BrandMark — a real brand logo on a softly brand-tinted tile (≤12% of the
 * brand color over white, per color governance). Gracefully falls back to the
 * brand initials on the same tinted ground when there is no domain or the image
 * fails to load — so the footprint never shifts. Client component (load-error
 * state); server components may render it.
 */
export function BrandMark({
  domain,
  initials,
  color,
  size = "md",
  className,
  ...rest
}: BrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const tile = TILE[size];
  const logo = LOGO[size];
  const ariaLabel = rest["aria-label"] ?? `${initials} logo`;
  // Scope the brand tint to this tile via the --brand CSS var.
  const style = { width: tile, height: tile, "--brand": color || undefined } as React.CSSProperties;

  const showFallback = !domain || failed;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={style}
      className={cn(
        "brand-tile relative inline-flex shrink-0 items-center justify-center rounded-md border border-line",
        className,
      )}
    >
      {showFallback ? (
        <span
          aria-hidden="true"
          className="font-bold uppercase leading-none"
          style={{
            fontSize: Math.round(logo * 0.62),
            color: isLightColor(color) ? "#1A1A1A" : color || "#1A1A1A",
          }}
        >
          {(initials || "—").slice(0, 3)}
        </span>
      ) : (
        // Plain <img> (not next/image) to avoid image-domain config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc(domain!, size === "sm" ? 128 : 256)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: logo, height: logo }}
          className="rounded-[7px] object-contain"
        />
      )}
    </div>
  );
}

export default BrandMark;
