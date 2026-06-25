import React from "react";
import { cn } from "./cn";

/**
 * Shell · Concept A page scaffold primitives.
 * Monochrome "terminal/excavation" archive: hairline inset frame, L-shaped
 * registration corner ticks, bracketed mono labels, tabular figures.
 * Logical CSS props throughout so everything mirrors automatically in RTL.
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

/** 6px L-shaped registration tick. `corner` picks which two edges draw. */
function CornerTick({
  corner,
}: {
  corner: "ss" | "se" | "es" | "ee";
}) {
  // ss = start/top, se = start/bottom, es = end/top, ee = end/bottom
  const pos: Record<typeof corner, string> = {
    ss: "start-0 top-0 border-s border-t",
    se: "start-0 bottom-0 border-s border-b",
    es: "end-0 top-0 border-e border-t",
    ee: "end-0 bottom-0 border-e border-b",
  };
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute h-1.5 w-1.5 border-ink",
        pos[corner],
      )}
    />
  );
}

/**
 * PageFrame — full-page template with a hairline inset frame, corner ticks and
 * a centered max-w-content slot. The primary frame rule carries `.mo-draw-x`.
 */
export function PageFrame({
  children,
  header,
  footer,
  className,
}: PageFrameProps) {
  return (
    <div className={cn("min-h-screen bg-paper text-ink", className)}>
      <div className="p-6">
        <div className="relative border border-hairline mo-draw-x">
          <CornerTick corner="ss" />
          <CornerTick corner="es" />
          <CornerTick corner="se" />
          <CornerTick corner="ee" />
          <div className="p-6">
            {header}
            <div className="mx-auto w-full max-w-content">{children}</div>
            {footer}
          </div>
        </div>
      </div>
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
  as?: "h2" | "h3";
}

/** `§ NN / TITLE` on the start side, optional meta on the end, hairline below. */
export function SectionHeader({
  index,
  title,
  meta,
  as = "h2",
}: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className="flex items-end justify-between gap-4 border-b border-hairline pb-1.5">
      <Heading className="flex items-baseline gap-2 font-display text-ink">
        {index ? (
          <span className="label-mono text-metadata" dir="auto">
            § {index}
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
