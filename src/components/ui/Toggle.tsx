"use client";

import React from "react";
import { cn } from "./cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

/**
 * Toggle — accessible switch (ink when on). Controlled: pass `checked` +
 * `onChange`. Client component.
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:opacity-60",
        checked ? "border-ink bg-ink" : "border-line bg-surface-2",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-pill bg-white shadow-card transition-transform duration-150",
          checked ? "translate-x-[22px] rtl:-translate-x-[22px]" : "translate-x-1 rtl:-translate-x-1",
        )}
      />
    </button>
  );
}

export default Toggle;
