import React from "react";
import { cn } from "./cn";

export interface FacetRailProps {
  children: React.ReactNode;
  "aria-label"?: string;
  className?: string;
}

/**
 * FacetRail — sticky sidebar wrapper for filter facet groups. Server component.
 */
export function FacetRail({ children, className, ...rest }: FacetRailProps) {
  return (
    <aside
      {...rest}
      className={cn("sticky top-[88px] flex flex-col gap-5", className)}
    >
      {children}
    </aside>
  );
}

export interface FacetGroupProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * FacetGroup — a labeled cluster of FilterChips inside a FacetRail.
 * Server component.
 */
export function FacetGroup({ label, children, className }: FacetGroupProps) {
  return (
    <div className={className}>
      <div className="label mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default FacetRail;
