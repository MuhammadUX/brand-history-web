import React from "react";
import { cn } from "./cn";
import { Button } from "./Button";
import { safeHref } from "@/lib/safe-href";
import type { BrandFont } from "@/lib/types";

export interface FontSpecimenLabels {
  /** policy: host */
  brandFont: string;
  /** policy: link_out */
  getFont: string;
  /** policy: specimen_only */
  referenceNote: string;
  weightsLabel: string;
  foundryLabel: string;
  licenseLabel: string;
}

export interface FontSpecimenProps {
  font: BrandFont;
  isAr?: boolean;
  labels: FontSpecimenLabels;
  className?: string;
}

const DEFAULT_SPECIMEN_EN = "AaBbCc 0123";
const DEFAULT_SPECIMEN_AR = "أبجد هوز ٠١٢٣";

/**
 * FontSpecimen — one typeface block: family + role + weights, a large reference
 * specimen rendered in the font's `css_stack` (Latin and, when present, Arabic),
 * and a policy-aware control — host → "Brand font" tag, link_out → "Get the font"
 * button, specimen_only → a muted reference note with foundry / license. Server
 * component.
 */
export function FontSpecimen({
  font,
  isAr = false,
  labels,
  className,
}: FontSpecimenProps) {
  const stack = font.css_stack || undefined;
  // WEB-5: only offer the "Get the font" link for safe http(s) URLs.
  const fontHref = safeHref(font.source_url);
  const specimenEn = font.specimen_en || DEFAULT_SPECIMEN_EN;
  const specimenAr = font.specimen_ar;

  // Specimen should preview the actual typeface — render in its css_stack.
  const specimenStyle: React.CSSProperties = stack
    ? { fontFamily: stack }
    : {};

  return (
    <div
      className={cn(
        "rounded-md border border-line bg-surface p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h4 className="text-[16px] font-bold text-ink">{font.family}</h4>
          {font.role ? (
            <p className="label mt-0.5">{font.role}</p>
          ) : null}
        </div>
        {font.weights ? (
          <p className="text-[12px] text-muted">
            <span className="label me-1">{labels.weightsLabel}</span>
            <span className="tnum text-ink">{font.weights}</span>
          </p>
        ) : null}
      </div>

      {/* Reference rendering — preview text in the actual css_stack. */}
      <div className="mt-4 rounded-md border border-line bg-surface-2 px-4 py-5">
        <p
          dir="ltr"
          style={specimenStyle}
          className="truncate text-[34px] leading-tight text-ink"
        >
          {specimenEn}
        </p>
        {specimenAr ? (
          <p
            dir="rtl"
            style={specimenStyle}
            className="font-arabic mt-2 truncate text-[30px] leading-tight text-ink"
          >
            {specimenAr}
          </p>
        ) : null}
      </div>

      {/* Policy-aware footer. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {font.policy === "host" ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.03em] text-ink">
            {labels.brandFont}
          </span>
        ) : null}

        {font.policy === "link_out" && fontHref ? (
          <Button
            href={fontHref}
            variant="ghost"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {labels.getFont} ↗
          </Button>
        ) : null}

        {font.policy === "specimen_only" ? (
          <p className="text-[12px] italic text-muted">{labels.referenceNote}</p>
        ) : null}

        {font.foundry ? (
          <span className="text-[12px] text-muted">
            <span className="label me-1">{labels.foundryLabel}</span>
            {font.foundry}
          </span>
        ) : null}
        {font.license ? (
          <span className="text-[12px] text-muted">
            <span className="label me-1">{labels.licenseLabel}</span>
            {font.license}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default FontSpecimen;
