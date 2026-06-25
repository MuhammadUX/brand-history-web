import React from "react";
import { cn } from "./cn";
import { Button } from "./Button";

export interface AdSlotProps {
  label: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  cta?: React.ReactNode;
  ctaHref?: string;
  variant?: "row" | "sidebar";
  className?: string;
}

/**
 * AdSlot — the PRESENTATIONAL "Sponsored" shell only (no entitlement gating;
 * that lives in the existing server @/components/AdSlot). Dashed, clearly
 * labeled. `row` lays out horizontally; `sidebar` stacks. Server component.
 */
export function AdSlot({
  label,
  title,
  body,
  cta,
  ctaHref,
  variant = "row",
  className,
}: AdSlotProps) {
  const isSidebar = variant === "sidebar";
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-line bg-surface-2",
        isSidebar
          ? "flex flex-col items-start gap-3 p-4"
          : "flex items-center gap-[18px] p-5",
        className,
      )}
    >
      <span className="label inline-flex shrink-0 rounded-[5px] border border-line px-1.5 py-0.5">
        Sponsored
      </span>
      <div className="min-w-0 flex-1">
        <div className="sr-only">{label}</div>
        <div className="text-[15px] font-bold text-ink">{title}</div>
        {body ? <p className="mt-0.5 text-[12.5px] text-muted">{body}</p> : null}
      </div>
      {cta ? (
        ctaHref ? (
          <Button variant="ghost" size="sm" href={ctaHref} className={isSidebar ? "" : "ms-auto"}>
            {cta}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className={isSidebar ? "" : "ms-auto"}>
            {cta}
          </Button>
        )
      ) : null}
    </div>
  );
}

export default AdSlot;
