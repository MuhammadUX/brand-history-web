"use client";

import React, { useId, useRef, useState } from "react";
import { cn } from "./cn";
import { BrandMark } from "./BrandMark";
import { safeHref } from "@/lib/safe-href";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

export interface EvolutionEra {
  id: string;
  year: number;
  title: string;
  /** "what changed" caption shown prominently when the era is selected. */
  caption?: string | null;
  /** change_kind → drives the tag label. */
  changeKind?: string | null;
  /** Optional per-era logo image; falls back to the brand mark. */
  logoUrl?: string | null;
  credit?: string | null;
  sourceUrl?: string | null;
}

/** Resolved (client-side) string labels. */
interface EvolutionStripLabels {
  heading: string;
  kinds: Record<string, string>;
  compare: string;
  sourceLabel: string;
  whatChanged: string;
  selectAria: (year: number, title: string) => string;
}

export interface EvolutionStripProps {
  eras: EvolutionEra[];
  /** Brand identity for the era mark fallback. */
  domain?: string | null;
  initials: string;
  color?: string | null;
  compareHref?: string;
  /** Locale — labels are resolved client-side (no function props across the boundary). */
  locale: Locale;
  className?: string;
}

/**
 * EvolutionStrip — the signature horizontal evolution ribbon. Each era is a
 * selectable tile (year · mark · title · change-kind tag); selecting one surfaces
 * its "what changed" caption prominently above the strip. Keyboard accessible as
 * a horizontal radio group (Arrow/Home/End), RTL-aware via logical utilities,
 * calm + on-brand (marks, years, hairlines, one accent). Client component.
 */
export function EvolutionStrip({
  eras,
  domain,
  initials,
  color,
  compareHref,
  locale,
  className,
}: EvolutionStripProps) {
  const dict = getDictionary(locale);
  const p = dict.brand.profile;
  const labels: EvolutionStripLabels = {
    heading: p.evolutionTitle,
    kinds: p.changeKinds,
    compare: dict.brand.compare,
    sourceLabel: p.source,
    whatChanged: p.whatChanged,
    selectAria: p.evolutionSelectAria,
  };

  // Default to the most recent (last) era — the current identity.
  const [selected, setSelected] = useState(eras.length - 1);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupId = useId();

  if (eras.length < 2) return null;

  const focusTile = (i: number) => {
    const clamped = Math.max(0, Math.min(eras.length - 1, i));
    setSelected(clamped);
    tileRefs.current[clamped]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    // Resolve logical direction (RTL flips Arrow Left/Right).
    const rtl =
      typeof document !== "undefined" &&
      document.documentElement.dir === "rtl";
    const next = rtl ? -1 : 1;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTile(i + next);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusTile(i - next);
        break;
      case "Home":
        e.preventDefault();
        focusTile(0);
        break;
      case "End":
        e.preventDefault();
        focusTile(eras.length - 1);
        break;
      default:
        break;
    }
  };

  const active = eras[selected];
  // WEB-5: only render the source link for safe http(s) URLs.
  const activeSourceHref = safeHref(active.sourceUrl);
  const kindLabel = (kind?: string | null) =>
    kind ? labels.kinds[kind] ?? kind : null;

  return (
    <div
      style={{ "--brand": color || undefined } as React.CSSProperties}
      className={cn(
        "rounded-lg border border-line bg-surface shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 px-5 pt-4">
        <h3 className="text-[13px] font-bold uppercase tracking-label text-muted">
          {labels.heading}
        </h3>
        {compareHref ? (
          <a
            href={compareHref}
            className="shrink-0 text-[13px] font-semibold text-link hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {labels.compare} →
          </a>
        ) : null}
      </div>

      {/* "What changed" — prominent, updates with selection (aria-live). */}
      <div
        aria-live="polite"
        className="mx-5 mt-3 rounded-md border border-line bg-surface-2 px-4 py-3"
      >
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="tnum text-[20px] font-extrabold leading-none text-ink">
            {active.year}
          </span>
          <span className="text-[14px] font-semibold text-ink">
            {active.title}
          </span>
          {kindLabel(active.changeKind) ? (
            <span
              className="rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]"
              style={{
                color: "var(--brand)",
                backgroundColor:
                  "color-mix(in srgb, var(--brand) 12%, #fff)",
              }}
            >
              {kindLabel(active.changeKind)}
            </span>
          ) : null}
        </div>
        {active.caption ? (
          <p className="mt-1.5 text-[13px] leading-snug text-ink">
            <span className="label me-1.5">{labels.whatChanged}</span>
            {active.caption}
          </p>
        ) : null}
        {activeSourceHref ? (
          <a
            href={activeSourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-[12px] font-semibold text-link hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {labels.sourceLabel} ↗
          </a>
        ) : null}
      </div>

      {/* The scrubbable ribbon of era tiles. */}
      <div
        role="radiogroup"
        aria-label={labels.heading}
        className="flex gap-3 overflow-x-auto px-5 pb-5 pt-4"
      >
        {eras.map((era, i) => {
          const isSel = i === selected;
          return (
            <button
              key={era.id}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              aria-label={labels.selectAria(era.year, era.title)}
              id={`${groupId}-era-${i}`}
              tabIndex={isSel ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex w-[132px] shrink-0 flex-col items-center gap-2 rounded-md border bg-surface px-3 py-3 text-center transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
                isSel
                  ? "border-ink shadow-card"
                  : "border-line hover:bg-surface-2",
              )}
            >
              <span className="tnum text-[13px] font-bold text-ink">
                {era.year}
              </span>
              {era.logoUrl ? (
                <span className="brand-tile flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={era.logoUrl}
                    alt=""
                    loading="lazy"
                    className="h-8 w-8 object-contain"
                  />
                </span>
              ) : (
                <BrandMark
                  domain={domain}
                  initials={initials}
                  color={color}
                  size="sm"
                />
              )}
              <span className="line-clamp-2 text-[11.5px] font-semibold leading-tight text-ink">
                {era.title}
              </span>
              {kindLabel(era.changeKind) ? (
                <span className="rounded-pill border border-line bg-surface-2 px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.03em] text-muted">
                  {kindLabel(era.changeKind)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EvolutionStrip;
