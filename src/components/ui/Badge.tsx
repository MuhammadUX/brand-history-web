import React from "react";
import { cn } from "./cn";

export type BadgeKind = "verified" | "pro" | "archived" | "state" | "neutral";

const KINDS: Record<BadgeKind, string> = {
  // ✓ Verified — green, soft.
  verified: "text-ok border-[#bfe6cd] bg-[#eef9f1]",
  // PRO — ink lock.
  pro: "text-white border-ink bg-ink",
  // Archived — amber "not for current use".
  archived: "text-amber border-amber-line bg-amber-bg",
  // Generic state (draft/in_review/etc.) — neutral hairline.
  state: "text-muted border-line bg-surface-2",
  neutral: "text-muted border-line bg-surface-2",
};

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "className"> {
  kind?: BadgeKind;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Badge — small status pill. verified (✓), pro (lock), archived (amber),
 * state/neutral. Children optional; verified/archived supply a default glyph
 * label if no children are passed.
 */
export function Badge({ kind = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.03em]",
        KINDS[kind],
        className,
      )}
      {...rest}
    >
      {children ??
        (kind === "verified" ? "✓ Verified" : kind === "archived" ? "Archived" : null)}
    </span>
  );
}

export default Badge;
