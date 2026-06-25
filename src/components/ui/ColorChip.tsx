"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface ColorChipProps {
  name: React.ReactNode;
  hex: string;
  role?: React.ReactNode;
  copyLabel?: string;
  copiedLabel?: string;
  onCopied?: (hex: string) => void;
  className?: string;
}

/**
 * ColorChip — click-to-copy color swatch row. Copies the hex to the clipboard
 * and flashes a "Copied" label for ~1.4s. Client component (clipboard + state).
 */
export function ColorChip({
  name,
  hex,
  role,
  copyLabel = "COPY",
  copiedLabel = "COPIED",
  onCopied,
  className,
}: ColorChipProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(hex);
      }
    } catch {
      // Clipboard may be unavailable (insecure context / permissions) — ignore.
    }
    setCopied(true);
    onCopied?.(hex);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${hex}`}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border border-line px-2.5 py-2 text-start transition-colors hover:bg-surface-2 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
        className,
      )}
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: hex }}
        className="h-[34px] w-[34px] shrink-0 rounded-md border border-black/10"
      />
      <span className="min-w-0">
        <span className="block text-[12.5px] font-semibold text-ink">{name}</span>
        <span className="tnum block text-[12.5px] text-muted">
          {hex}
          {role ? <span className="ms-1.5">{role}</span> : null}
        </span>
      </span>
      <span
        className={cn(
          "ms-auto text-[10px] font-bold uppercase tracking-[0.04em]",
          copied ? "text-ok" : "text-muted",
        )}
      >
        {copied ? copiedLabel : copyLabel}
      </span>
    </button>
  );
}

export default ColorChip;
