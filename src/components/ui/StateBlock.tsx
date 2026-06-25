import React from "react";
import { cn } from "./cn";

export interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton — a single shimmering placeholder line/box (reduced-motion safe via
 * globals.css). Compose your own loading layouts with it.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("lib-skeleton", className)} />;
}

export interface StateBlockProps {
  state: "empty" | "error" | "loading" | "skeleton";
  title?: React.ReactNode;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Number of placeholder cards rendered for state="skeleton". */
  count?: number;
  className?: string;
}

/**
 * StateBlock — unified empty / error / loading / skeleton states. empty &
 * error render a centered card; loading shows calm stacked skeleton lines;
 * skeleton renders a responsive grid of placeholder cards. Server component.
 */
export function StateBlock({
  state,
  title,
  message,
  icon,
  action,
  count = 8,
  className,
}: StateBlockProps) {
  if (state === "skeleton") {
    return (
      <div
        className={cn(
          "grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(170px,1fr))]",
          className,
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border border-line bg-surface p-4">
            <Skeleton className="mb-3.5 h-16" />
            <Skeleton className="mb-2 h-[11px]" />
            <Skeleton className="h-[11px] w-[55%]" />
          </div>
        ))}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div
        className={cn(
          "rounded-lg border border-line bg-surface p-10 shadow-card",
          className,
        )}
      >
        <div className="mx-auto flex max-w-[280px] flex-col gap-2.5">
          <Skeleton className="h-[11px]" />
          <Skeleton className="h-[11px] w-[80%]" />
          <Skeleton className="h-[11px] w-[55%]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface p-10 text-center shadow-card",
        className,
      )}
    >
      {icon ? <div className="mb-2.5 text-[30px]">{icon}</div> : null}
      {title ? (
        <h3 className="text-[18px] font-bold tracking-tight text-ink">{title}</h3>
      ) : null}
      {message ? (
        <p className="mx-auto mt-1.5 max-w-[46ch] text-[14px] text-muted">
          {message}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default StateBlock;
