import React from "react";
import { cn } from "./cn";

export type BadgeKind =
  | "filter"
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "unpublished"
  | "verified"
  | "confidence-H"
  | "confidence-M"
  | "confidence-L"
  | "pro";

export interface BadgeProps {
  kind: BadgeKind;
  /** Override / supply the label. Required for `filter` kind. */
  children?: React.ReactNode;
  className?: string;
}

/** Default label per kind. `filter` defers to children. */
const LABEL: Record<BadgeKind, string> = {
  filter: "",
  draft: "DRAFT",
  in_review: "IN REVIEW",
  approved: "APPROVED",
  published: "PUBLISHED",
  unpublished: "UNPUBLISHED",
  verified: "✓ VERIFIED",
  pro: "PRO",
  "confidence-H": "CONF · H",
  "confidence-M": "CONF · M",
  "confidence-L": "CONF · L",
};

/** Confidence chip glyph prefix: filled / half / outline. */
const CONFIDENCE_GLYPH: Partial<Record<BadgeKind, string>> = {
  "confidence-H": "■",
  "confidence-M": "▣",
  "confidence-L": "□",
};

/** Tone per kind: filled ink, ink-bordered, or hairline-bordered. */
const TONE: Record<BadgeKind, string> = {
  approved: "bg-ink text-paper border border-ink",
  pro: "bg-ink text-paper border border-ink",
  verified: "border border-ink text-ink",
  filter: "border border-hairline text-ink",
  draft: "border border-hairline text-ink",
  in_review: "border border-hairline text-ink",
  published: "border border-hairline text-ink",
  unpublished: "border border-hairline text-ink",
  "confidence-H": "border border-hairline text-ink",
  "confidence-M": "border border-hairline text-ink",
  "confidence-L": "border border-hairline text-ink",
};

/**
 * Badge — read-only mono `[ BRACKET ]` status signifier. Sharp 0px, hairline
 * (or ink-filled) bordered, `.label-mono` text. Renders as a non-interactive
 * `<span>`, never a button. `confidence-*` kinds prepend a shape chip glyph.
 */
export function Badge({ kind, children, className }: BadgeProps) {
  const glyph = CONFIDENCE_GLYPH[kind];
  const label = children ?? LABEL[kind];

  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1 rounded-none px-1 py-0.5 align-middle",
        TONE[kind],
        className,
      )}
    >
      <span aria-hidden="true">[</span>
      {glyph && <span aria-hidden="true">{glyph}</span>}
      <span>{label}</span>
      <span aria-hidden="true">]</span>
    </span>
  );
}

/** Tag — alias of Badge. */
export const Tag = Badge;
