"use client";

import { useState } from "react";

interface CopyButtonProps {
  value: string;
  label: string;
  className?: string;
  copiedLabel?: string;
}

export default function CopyButton({
  value,
  label,
  className,
  copiedLabel = "Copied ✓",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available; silently ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        "inline-flex items-center justify-center rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      }
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
