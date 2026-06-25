import React from "react";
import { cn } from "./cn";

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table — archive ledger. Sharp 0px, 1px hairline frame, collapsed borders,
 * mono text on `surface`. Compose with THead / TRow / TCell / ActionCell.
 */
export function Table({ children, className }: TableProps) {
  return (
    <table
      className={cn(
        "w-full border-collapse border border-hairline bg-surface font-mono",
        className,
      )}
    >
      {children}
    </table>
  );
}

export interface THeadProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * THead — header band. Holds a single header `<tr>` (children are `<th>` cells,
 * use `<TCell head>`). The row carries a 2px ink bottom rule.
 */
export function THead({ children, className }: THeadProps) {
  return (
    <thead className={className}>
      <tr className="border-b-2 border-ink">{children}</tr>
    </thead>
  );
}

export interface TRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * TRow — body row. 1px scaffold bottom rule that steps to a 1px ink rule on
 * hover (no crossfade — `mo-invert`). Pass-through `onClick` and other tr attrs.
 */
export function TRow({ children, className, ...rest }: TRowProps) {
  return (
    <tr
      className={cn(
        "mo-invert border-b border-scaffold hover:border-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export interface TCellProps {
  /** Render a `<th>` header cell instead of a `<td>`. */
  head?: boolean;
  /** Logical alignment. `end` right-aligns (tabular numerics). */
  align?: "start" | "end";
  children?: React.ReactNode;
  className?: string;
}

/**
 * TCell — table cell. Header cells use `.label-mono`; body cells are mono 13px.
 * `align="end"` uses logical `text-end` (RTL-safe) and tabular figures.
 */
export function TCell({
  head = false,
  align = "start",
  children,
  className,
}: TCellProps) {
  const classes = cn(
    "px-2 py-1.5",
    align === "end" ? "text-end tabular-nums" : "text-start",
    head ? "label-mono" : "text-[13px]",
    className,
  );

  if (head) {
    return (
      <th scope="col" className={classes}>
        {children}
      </th>
    );
  }
  return <td className={classes}>{children}</td>;
}

export interface ActionCellProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * ActionCell — right-aligned (logical end) body cell for a small ghost Button.
 */
export function ActionCell({ children, className }: ActionCellProps) {
  return (
    <td className={cn("px-2 py-1.5 text-end", className)}>{children}</td>
  );
}
