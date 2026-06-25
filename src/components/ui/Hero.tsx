import React from "react";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";
import { Chip } from "./Chip";
import { Badge } from "./Badge";

export interface HeroProps {
  name: React.ReactNode;
  arName?: React.ReactNode;
  initials: string;
  domain?: string | null;
  color?: string | null;
  verified?: boolean;
  /** Meta chips (sector, founded, HQ …) — each rendered as a Chip. */
  meta?: React.ReactNode[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Hero — brand profile header. White surface with an 8px brand-rule cap,
 * a large logo mark, the display name (+ optional Arabic name), a meta chip
 * row, a Verified badge, and an actions column. Server component.
 */
export function Hero({
  name,
  arName,
  initials,
  domain,
  color,
  verified = false,
  meta,
  actions,
  className,
}: HeroProps) {
  return (
    <div
      style={{ "--brand": color || undefined } as React.CSSProperties}
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface shadow-card",
        className,
      )}
    >
      <div className="brand-rule h-2 w-full" />
      <div className="flex flex-col gap-6 p-7 sm:flex-row">
        <BrandMark
          domain={domain}
          initials={initials}
          color={color}
          size="lg"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
            {name}
          </h1>
          {arName ? (
            <p className="font-arabic mt-1 text-[18px] text-muted">{arName}</p>
          ) : null}
          {(meta && meta.length > 0) || verified ? (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {verified ? <Badge kind="verified" /> : null}
              {meta?.map((item, i) => <Chip key={i}>{item}</Chip>)}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-col gap-2.5 sm:ms-auto max-sm:flex-row max-sm:flex-wrap">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Hero;
