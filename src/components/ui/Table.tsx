import React from "react";
import { cn } from "./cn";

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Table — admin data table shell. Horizontally scrollable, hairline-framed.
 * Compose with THead, TRow, TCell and ActionCell. Server component.
 */
export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line", className)}>
      <table className="w-full border-collapse text-[14px]">{children}</table>
    </div>
  );
}

export interface THeadProps {
  children: React.ReactNode;
  className?: string;
}

/** THead — table header row (muted ground, hairline base). */
export function THead({ children, className }: THeadProps) {
  return (
    <thead>
      <tr className={cn("border-b border-line bg-surface-2 text-start", className)}>
        {children}
      </tr>
    </thead>
  );
}

export interface TRowProps {
  children: React.ReactNode;
  className?: string;
}

/** TRow — table body row with hover affordance. */
export function TRow({ children, className }: TRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-line last:border-b-0 hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </tr>
  );
}

const ALIGN: Record<NonNullable<TCellProps["align"]>, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

export interface TCellProps {
  children?: React.ReactNode;
  head?: boolean;
  align?: "start" | "end" | "center";
  className?: string;
}

/**
 * TCell — a cell; renders <th> (label styling) when `head`, else <td>.
 * `align` maps to logical text alignment. RTL-safe.
 */
export function TCell({ children, head = false, align = "start", className }: TCellProps) {
  if (head) {
    return (
      <th className={cn("label px-4 py-3 text-start", ALIGN[align], className)}>
        {children}
      </th>
    );
  }
  return (
    <td className={cn("px-4 py-3 align-middle", ALIGN[align], className)}>
      {children}
    </td>
  );
}

export interface ActionCellProps {
  children?: React.ReactNode;
  className?: string;
}

/** ActionCell — a trailing <td> aligned to the inline end for row actions. */
export function ActionCell({ children, className }: ActionCellProps) {
  return (
    <td className={cn("px-4 py-3 align-middle text-end", className)}>{children}</td>
  );
}

export default Table;
