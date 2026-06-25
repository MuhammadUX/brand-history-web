import React from "react";
import Link from "next/link";
import { cn } from "./cn";
import { BrandMark } from "../BrandMark";
import { Badge } from "./Badge";

export interface BrandCardProps {
  name: string;
  /** Secondary line, e.g. sector · region. */
  meta?: string;
  /** 1–3 char specimen initials for the plate. */
  initials: string;
  /** Brand website domain — when set, BrandMark shows the real logo. */
  domain?: string | null;
  /** Optional link target — overlays the card with a stretched Next `<Link>`. */
  href?: string;
  /** Accessible label for the stretched link (defaults to `name`). */
  hrefLabel?: string;
  /** Catalogue code shown on the plate, e.g. "BH-0042". */
  code?: string;
  verified?: boolean;
  selected?: boolean;
  /** Extra slot, e.g. a favorite button. Rendered above the link overlay. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * BrandCard — presentational archive specimen card. Vertical stack: DitherPlate,
 * display-type name, mono meta line, then a badge row. Sharp 0px, 1px hairline
 * frame on `surface`. `selected` inverts the plate (negative) and shows a
 * `[ SELECTED ]` tag.
 *
 * `href` uses the **stretched-link** pattern: the card stays a `<div>` and an
 * absolutely-positioned `<Link>` (z-0) covers it as the click target, while the
 * badge-row slot sits in a `relative z-10` layer above it. This keeps any
 * interactive `children` (e.g. a favorite `<button>`) a real sibling of the
 * link rather than nested inside an anchor — no button-in-anchor, no JS handler
 * needed to stop card navigation.
 */
export function BrandCard({
  name,
  meta,
  initials,
  domain,
  href,
  hrefLabel,
  code,
  verified = false,
  selected = false,
  children,
  className,
}: BrandCardProps) {
  const frame = cn(
    "group relative flex flex-col items-start rounded-none border border-hairline bg-surface p-2",
    href && "mo-invert hover:border-ink",
    selected && "border-ink",
    className,
  );

  return (
    <div className={frame} aria-current={selected ? "true" : undefined}>
      {href && (
        <Link
          href={href}
          aria-label={hrefLabel ?? name}
          className="absolute inset-0 z-0"
        />
      )}
      <BrandMark
        domain={domain}
        initials={initials}
        size="md"
        code={code}
        codeOnHover
        negative={selected}
      />
      <h3 className="mt-2 font-display text-lg leading-tight text-ink">
        {name}
      </h3>
      {meta && (
        <p className="mt-1 font-mono text-[11px] text-metadata">{meta}</p>
      )}
      {/* Label budget: at rest a card shows only name + meta. The verified
          stamp and the favorite control reveal on hover/focus (instant opacity
          toggle — no transition, so reduced-motion shows them immediately on
          focus). `selected` stays visible as it is an active state. */}
      {(verified || selected || children) && (
        <div
          className={cn(
            "relative z-10 mt-2 flex flex-wrap items-center gap-1.5",
            !selected &&
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          {verified && <Badge kind="verified" />}
          {selected && <Badge kind="filter">SELECTED</Badge>}
          {children}
        </div>
      )}
    </div>
  );
}
