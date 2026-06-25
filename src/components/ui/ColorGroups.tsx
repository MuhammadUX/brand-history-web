"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { colorFormats, type ColorFormat } from "@/lib/color";
import { getDictionary } from "@/i18n";
import type { BrandColor, Locale } from "@/lib/types";

const FORMATS: ColorFormat[] = ["HEX", "RGB", "HSL"];

/** Resolved (serializable) string labels used inside this client tree. */
interface ColorGroupsLabels {
  roles: Record<string, string>;
  other: string;
  copy: string;
  copied: string;
  copyAll: string;
  copiedAll: string;
  copyAria: (value: string) => string;
}

export interface ColorGroupsProps {
  colors: BrandColor[];
  /** Locale — labels are resolved client-side (no function props across the boundary). */
  locale: Locale;
  className?: string;
}

/** Canonical role ordering; anything else collapses under "Other". */
const ROLE_ORDER = ["primary", "secondary", "neutral", "accent"];

function useCopyFlash(): [boolean, (text: string) => void] {
  const [flashed, setFlashed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        void navigator.clipboard.writeText(text);
      }
    } catch {
      /* clipboard may be unavailable — ignore */
    }
    setFlashed(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlashed(false), 1400);
  };
  return [flashed, copy];
}

function Swatch({
  color,
  labels,
}: {
  color: BrandColor;
  labels: ColorGroupsLabels;
}) {
  const fmts = colorFormats(color.hex);
  const [active, setActive] = useState<ColorFormat>("HEX");
  const [flashed, copy] = useCopyFlash();

  // Fallback for an unparseable hex — still show the raw value, never color-only.
  const value = fmts ? fmts[active] : color.hex;

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => copy(value)}
        aria-label={labels.copyAria(value)}
        className="group relative flex h-[68px] items-end justify-end p-2 transition-[filter] hover:brightness-[0.98] focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-link"
        style={{ backgroundColor: color.hex }}
      >
        <span
          className={cn(
            "rounded-pill bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            flashed && "opacity-100",
          )}
        >
          {flashed ? labels.copied : labels.copy}
        </span>
      </button>
      <div className="border-t border-line px-2.5 py-2">
        <span className="block truncate text-[12px] font-semibold text-ink">
          {color.name}
        </span>
        <span className="tnum mt-0.5 block truncate text-[11.5px] text-muted">
          {value}
        </span>
        {fmts ? (
          <div
            role="group"
            className="mt-1.5 inline-flex overflow-hidden rounded-[7px] border border-line"
          >
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                aria-pressed={active === f}
                className={cn(
                  "px-1.5 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.03em] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-link",
                  active === f
                    ? "bg-ink text-white"
                    : "bg-surface text-muted hover:bg-surface-2",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Group({
  title,
  colors,
  labels,
}: {
  title: string;
  colors: BrandColor[];
  labels: ColorGroupsLabels;
}) {
  const [flashed, copy] = useCopyFlash();
  const copyAll = () => {
    const text = colors
      .map((c) => {
        const f = colorFormats(c.hex);
        return `${c.name}: ${f ? f.HEX : c.hex}`;
      })
      .join("\n");
    copy(text);
  };

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h4 className="label">{title}</h4>
        {colors.length > 1 ? (
          <button
            type="button"
            onClick={copyAll}
            className={cn(
              "text-[11px] font-semibold transition-colors hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
              flashed ? "text-ok" : "text-link",
            )}
          >
            {flashed ? labels.copiedAll : labels.copyAll}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {colors.map((c) => (
          <Swatch key={c.id} color={c} labels={labels} />
        ))}
      </div>
    </div>
  );
}

/**
 * ColorGroups — role-grouped color swatches that scale to 20+. Groups by
 * `role` (primary → secondary → neutral → accent → Other), each group a labeled
 * row of click-to-copy swatches offering HEX / RGB / HSL (derived in code) plus a
 * per-group "copy all". The value is always shown as text — never color-only.
 * Client component (clipboard + per-swatch format state).
 */
export function ColorGroups({ colors, locale, className }: ColorGroupsProps) {
  const p = getDictionary(locale).brand.profile;
  const labels: ColorGroupsLabels = {
    roles: p.colorRoles,
    other: p.colorOther,
    copy: p.copy,
    copied: p.copied,
    copyAll: p.copyAll,
    copiedAll: p.copiedAll,
    copyAria: p.copyValueAria,
  };

  if (colors.length === 0) return null;

  // Bucket by normalized role.
  const buckets = new Map<string, BrandColor[]>();
  for (const c of colors) {
    const raw = (c.role || "").trim().toLowerCase();
    const key = ROLE_ORDER.includes(raw) ? raw : "__other";
    const arr = buckets.get(key) ?? [];
    arr.push(c);
    buckets.set(key, arr);
  }

  const orderedKeys = [
    ...ROLE_ORDER.filter((k) => buckets.has(k)),
    ...(buckets.has("__other") ? ["__other"] : []),
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {orderedKeys.map((key) => (
        <Group
          key={key}
          title={key === "__other" ? labels.other : labels.roles[key] ?? key}
          colors={buckets.get(key)!}
          labels={labels}
        />
      ))}
    </div>
  );
}

export default ColorGroups;
