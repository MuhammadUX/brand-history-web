"use client";

import React, { useMemo } from "react";
import { cn } from "./cn";
import { BAYER_4x4, useDevelopIn } from "@/lib/motion";

export type DitherSize = "sm" | "md" | "lg";

export interface DitherPlateProps {
  /** 1–3 char specimen initials, drawn on the clean strip. */
  initials: string;
  size?: DitherSize;
  /** 0..1 — overall density bias. Higher = more ink cells. */
  density?: number;
  /** Catalogue code shown top-left, e.g. "BH-0042". */
  code?: string;
  /**
   * Label-budget control: when true the code chip is hidden at rest and only
   * revealed on hover/focus of the enclosing `group` (instant — no transition,
   * so it is reduced-motion-safe). Used on grid cards; leave false for the
   * single hero specimen plate where the code reads at rest.
   */
  codeOnHover?: boolean;
  /** Develop-in on scroll into view (M1). Default true. */
  develop?: boolean;
  /** Negative (inverted) plate — used for selected state. */
  negative?: boolean;
  className?: string;
  "aria-label"?: string;
}

const PX: Record<DitherSize, number> = { lg: 256, md: 180, sm: 120 };
const GRID = 16; // 16×16 cells, tiled Bayer 4×4

/**
 * DitherPlate — canonical flat ordered-Bayer 4×4 brand mark. Ink squares where
 * radial density > Bayer threshold (denser toward centre), a clean strip with
 * Space-Grotesk initials, a BH-#### code chip top-left, and an L registration
 * tick bottom-right. Rendered as crisp SVG rects (1-bit at every step).
 *
 * This is the ONLY way to render a plate — never hand-build one.
 */
export function DitherPlate({
  initials,
  size = "md",
  density = 0.55,
  code,
  codeOnHover = false,
  develop = true,
  negative = false,
  className,
  ...rest
}: DitherPlateProps) {
  const px = PX[size];
  const cell = px / GRID;
  const { ref, developed } = useDevelopIn<HTMLDivElement>();

  const inkColor = negative ? "var(--paper)" : "var(--ink)";
  const plateBg = negative ? "var(--ink)" : "var(--surface)";

  const rects = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const c = (GRID - 1) / 2;
    const maxD = Math.hypot(c, c);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        // radial bias: denser toward centre
        const d = Math.hypot(x - c, y - c) / maxD; // 0 centre → 1 edge
        const coverage = Math.min(1, Math.max(0, density + (0.5 - d)));
        const threshold = BAYER_4x4[y % 4][x % 4];
        if (coverage > threshold) out.push({ x: x * cell, y: y * cell });
      }
    }
    return out;
  }, [density, cell]);

  const stripH = Math.round(cell * 4);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={rest["aria-label"] ?? `${initials} specimen plate`}
      className={cn(
        "relative inline-block select-none",
        develop && developed && "mo-develop",
        className,
      )}
      style={{ width: px, height: px, "--cell-index": 0 } as React.CSSProperties}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
        className="block"
      >
        <rect width={px} height={px} fill={plateBg} />
        {/* dithered field (leave a clean strip at the bottom for initials) */}
        <g>
          {rects
            .filter((r) => r.y < px - stripH)
            .map((r, i) => (
              <rect
                key={i}
                x={r.x}
                y={r.y}
                width={cell}
                height={cell}
                fill={inkColor}
              />
            ))}
        </g>
        {/* clean strip */}
        <rect x={0} y={px - stripH} width={px} height={stripH} fill={plateBg} />
        <text
          x={cell}
          y={px - stripH / 2}
          dominantBaseline="central"
          fontFamily="var(--font-display)"
          fontWeight={700}
          fontSize={stripH * 0.6}
          fill={inkColor}
        >
          {initials}
        </text>
      </svg>

      {/* BH-#### code chip top-left. On grid cards (codeOnHover) it is hidden
          at rest and revealed instantly on group hover/focus — label budget. */}
      {code && (
        <span
          className={cn(
            "label-mono absolute left-1 top-1 bg-ink px-0.5 text-paper",
            codeOnHover &&
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}
          style={{ color: "var(--paper)" }}
        >
          [ {code} ]
        </span>
      )}
      {/* L registration tick bottom-right */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 right-1 block"
        style={{
          width: 6,
          height: 6,
          borderRight: `1px solid ${negative ? "var(--paper)" : "var(--ink)"}`,
          borderBottom: `1px solid ${negative ? "var(--paper)" : "var(--ink)"}`,
        }}
      />
    </div>
  );
}

export default DitherPlate;
