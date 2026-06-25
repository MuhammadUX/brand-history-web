import React from "react";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";

export interface TimelineProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Timeline — lays out TimelineEvents either horizontally (scrolling rail of
 * fixed-width columns) or vertically (a column with an inline-start rail and
 * node dots). Server component.
 */
export function Timeline({
  children,
  orientation = "vertical",
  className,
}: TimelineProps) {
  if (orientation === "horizontal") {
    return (
      <div
        className={cn(
          "grid grid-flow-col auto-cols-[min(180px,70vw)] gap-5 overflow-x-auto pb-2",
          className,
        )}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={cn("relative ps-[30px]", className)}>
      <div
        aria-hidden="true"
        className="absolute top-1.5 bottom-1.5 start-[7px] w-0.5 bg-line"
      />
      <div className="flex flex-col gap-7">{children}</div>
    </div>
  );
}

export interface TimelineEventProps {
  year: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  category?: React.ReactNode;
  domain?: string | null;
  initials?: string;
  color?: string | null;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * TimelineEvent — a single era marker: big brand-colored year, optional
 * logo-of-era thumbnail, title, description and category tag. In vertical
 * orientation it renders a node dot on the rail. Server component.
 */
export function TimelineEvent({
  year,
  title,
  description,
  category,
  domain,
  initials,
  color,
  orientation = "vertical",
  className,
}: TimelineEventProps) {
  const isVertical = orientation === "vertical";
  return (
    <div
      style={{ "--brand": color || undefined } as React.CSSProperties}
      className={cn(isVertical && "relative", className)}
    >
      {isVertical ? (
        <span
          aria-hidden="true"
          style={{ borderColor: color || "#E6E0D2" }}
          className="absolute start-[-30px] top-1.5 h-4 w-4 rounded-pill border-[3px] bg-surface"
        />
      ) : null}
      {category ? (
        <span className="mb-1.5 inline-block rounded-[5px] border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-muted">
          {category}
        </span>
      ) : null}
      <div className="flex items-start gap-3">
        {initials ? (
          <BrandMark
            domain={domain}
            initials={initials}
            color={color}
            size="sm"
            className="!h-[46px] !w-[46px] shrink-0"
          />
        ) : null}
        <div className="min-w-0">
          <div className="tnum text-[22px] font-extrabold tracking-[-0.02em] text-brand">
            {year}
          </div>
          {title ? (
            <div className="text-[14px] font-semibold text-ink">{title}</div>
          ) : null}
          {description ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
