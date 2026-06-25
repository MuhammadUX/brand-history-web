import React from "react";
import { cn } from "./cn";

export type StateBlockState = "empty" | "loading" | "error";

export interface StateBlockProps {
  state: StateBlockState;
  /** Headline (Space-Grotesk). Falls back to a per-state default. */
  title?: string;
  /** Mono sub-line. */
  message?: string;
  className?: string;
}

const DEFAULT_TITLE: Record<StateBlockState, string> = {
  empty: "— NO RECORD —",
  loading: "READING PLATE",
  error: "LOAD FAILED",
};

/**
 * StateBlock — dashed-hairline placeholder for empty / loading / error states.
 * Centered glyph + Space-Grotesk label + mono sub. Loading renders a 1-bit
 * cross-hatch scanning skeleton (`.mo-skeleton`). Sharp 0px throughout.
 * aria: loading → role="status"; error → role="alert".
 */
export function StateBlock({ state, title, message, className }: StateBlockProps) {
  const heading = title ?? DEFAULT_TITLE[state];
  const isError = state === "error";

  return (
    <div
      role={state === "loading" ? "status" : isError ? "alert" : undefined}
      aria-live={state === "loading" ? "polite" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-none border border-dashed p-4 text-center",
        isError ? "border-danger text-danger" : "border-hairline text-ink",
        className,
      )}
    >
      {state === "loading" ? (
        <>
          <div
            aria-hidden="true"
            className="mo-skeleton h-12 w-full max-w-[18rem] rounded-none"
          />
          <span className="label-mono text-metadata">[ READING PLATE… ]</span>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "font-display text-2xl leading-none",
              isError ? "text-danger" : "text-ink-700",
            )}
          >
            {isError ? "⚠" : "—"}
          </span>
          <span
            className={cn(
              "font-display text-sm uppercase tracking-label",
              isError ? "text-danger" : "text-ink",
            )}
          >
            {heading}
          </span>
          {message && (
            <span
              className={cn(
                "font-mono text-[11px]",
                isError ? "text-danger" : "text-metadata",
              )}
            >
              {message}
            </span>
          )}
        </>
      )}
    </div>
  );
}
