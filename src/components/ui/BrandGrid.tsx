import React from "react";
import { cn } from "./cn";

export interface BrandGridProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * BrandGrid — responsive auto-fill grid of BrandCards (min 170px columns),
 * matching the Library directory layout.
 */
export function BrandGrid({ className, children }: BrandGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface BrandRailProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * BrandRail — horizontal scroll shelf of fixed-width tiles (Trending /
 * Recently updated). Snap-scrolls on x.
 */
export function BrandRail({ className, children }: BrandRailProps) {
  return (
    <div
      className={cn(
        "grid grid-flow-col [grid-auto-columns:170px] gap-3.5 overflow-x-auto pb-2 [scroll-snap-type:x_proximity]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default BrandGrid;
