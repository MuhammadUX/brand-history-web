"use client";

import React, { useState } from "react";
import { DitherPlate } from "@/components/ds/DitherPlate";
import { cn } from "@/components/ds/cn";

export type BrandMarkSize = "sm" | "md" | "lg";

const PX: Record<BrandMarkSize, number> = { lg: 256, md: 180, sm: 120 };

export interface BrandMarkProps {
  /** Brand website domain, e.g. "nike.com". When set, the real logo is shown. */
  domain?: string | null;
  /** 1–3 char specimen initials for the DitherPlate fallback. */
  initials: string;
  size?: BrandMarkSize;
  /** Catalogue code (BH-####) — passed through to the fallback plate. */
  code?: string;
  codeOnHover?: boolean;
  /** Negative (inverted) — passed through to the fallback plate. */
  negative?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Resolve a monochrome logo URL for a domain. Uses logo.dev when a public token
 * is configured (sharp PNG up to 256px), otherwise Google's favicon service,
 * which needs no key and is reliable.
 */
export function logoSrc(domain: string): string {
  const token = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;
  if (token) {
    return `https://img.logo.dev/${domain}?token=${token}&size=256&format=png`;
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
}

/**
 * BrandMark — renders a REAL brand logo (rendered grayscale to fit the
 * Concept-A archive aesthetic) on a sharp `surface` tile, with the generated
 * DitherPlate as a graceful fallback. Falls back when no `domain` is provided
 * or when the logo image fails to load, so the footprint and look stay
 * identical to the canonical plate.
 *
 * Client component (uses load-error state); server components may render it.
 */
export function BrandMark({
  domain,
  initials,
  size = "md",
  code,
  codeOnHover = false,
  negative = false,
  className,
  ...rest
}: BrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const px = PX[size];
  const ariaLabel = rest["aria-label"] ?? `${initials} logo`;

  if (!domain || failed) {
    return (
      <DitherPlate
        initials={initials}
        size={size}
        code={code}
        codeOnHover={codeOnHover}
        negative={negative}
        className={className}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center justify-center rounded-none border border-hairline bg-surface p-4 align-bottom",
        className,
      )}
      style={{ width: px, height: px }}
    >
      {/* Plain <img> (not next/image) to avoid image-domain config. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc(domain)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="max-h-full max-w-full object-contain grayscale contrast-125"
      />
    </div>
  );
}

export default BrandMark;
