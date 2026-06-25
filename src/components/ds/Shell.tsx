import React from "react";
import { cn } from "./cn";

/**
 * Shell · Concept A page scaffold primitives.
 * Monochrome "terminal/excavation" archive: a single calm centered content
 * column with generous editorial margins — no ornamental inset frame, no
 * corner ticks (the page chrome carries the registration language once, not
 * every block). Logical CSS props throughout so everything mirrors in RTL.
 */

/* ------------------------------------------------------------------ PageFrame */

export interface PageFrameProps {
  children: React.ReactNode;
  /** Rendered above the centered content slot. */
  header?: React.ReactNode;
  /** Rendered below the centered content slot. */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * PageFrame — the single restrained content column. One centered
 * `max-w-content` measure with generous gutters; no decorative inset box or
 * corner ticks (those produced the "double-frame" look). Whitespace, not a
 * border, separates content from the full-bleed header/footer chrome.
 */
export function PageFrame({
  children,
  header,
  footer,
  className,
}: PageFrameProps) {
  return (
    <div className={cn("text-ink", className)}>
      {header}
      <div className="mx-auto w-full max-w-content px-6 py-8">{children}</div>
      {footer}
    </div>
  );
}

/** Spec alias. */
export const Shell = PageFrame;

/* --------------------------------------------------------------- SectionHeader */

export interface SectionHeaderProps {
  /** Section index, e.g. "01". Rendered as `§ NN`. */
  index?: string;
  title: string;
  meta?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
}

/**
 * `§ NN / TITLE` on the start side, optional meta on the end, hairline below.
 * Deliberately quiet: a faint `§ NN /` prefix in metadata tone, used sparingly
 * as a section divider — not a loud caption on every block.
 */
export function SectionHeader({
  index,
  title,
  meta,
  as = "h2",
}: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className="flex items-end justify-between gap-4 border-b border-hairline pb-2">
      <Heading className="flex items-baseline gap-2 font-display text-ink">
        {index ? (
          <span className="label-mono font-normal text-metadata" dir="auto">
            § {index} /
          </span>
        ) : null}
        <span>{title}</span>
      </Heading>
      {meta ? (
        <span className="label-mono text-metadata tabular-nums">{meta}</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- MetaStrip */

export interface MetaStripProps {
  items: (string | React.ReactNode)[];
  className?: string;
}

/** Dot-separated mono meta line; each item bidi-isolated for RTL safety. */
export function MetaStrip({ items, className }: MetaStripProps) {
  return (
    <div
      className={cn(
        "label-mono text-metadata tabular-nums flex flex-wrap items-center",
        className,
      )}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
          ) : null}
          <span dir="auto" style={{ unicodeBidi: "isolate" }}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- CodeChip */

export interface CodeChipProps {
  /** Catalogue code, e.g. "BH-0042". */
  code: string;
  className?: string;
}

/** Bracketed `[ CODE ]` chip, bidi-isolated, tabular. */
export function CodeChip({ code, className }: CodeChipProps) {
  return (
    <span
      dir="auto"
      style={{ unicodeBidi: "isolate" }}
      className={cn(
        "label-mono tabular-nums inline-block border border-hairline px-0.5 text-ink",
        className,
      )}
    >
      [ {code} ]
    </span>
  );
}
