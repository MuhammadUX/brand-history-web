"use client";

import { Toast, useToast } from "@/components/ds";

interface CopyHexButtonProps {
  /** The hex (or any value) to copy. */
  value: string;
  /** Visible label, e.g. the hex string. */
  label: string;
  /** Toast confirmation message after copy. */
  copiedLabel: string;
  className?: string;
}

/**
 * CopyHexButton — Concept A copy control. On copy it types the confirmation
 * into a DS <Toast> live region via typeOnToast (M-copy micro-interaction),
 * then hard-cuts. Mono, sharp, hairline; inverts on hover.
 */
export default function CopyHexButton({
  value,
  label,
  copiedLabel,
  className,
}: CopyHexButtonProps) {
  const toast = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.show(copiedLabel);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className={
          className ??
          "mo-invert mo-press inline-flex w-full items-center justify-center border border-hairline bg-paper px-2 py-1 font-mono text-[11px] tabular-nums text-ink hover:border-ink hover:bg-ink hover:text-paper"
        }
      >
        {label}
      </button>
      <Toast message={toast.message} visible={toast.message.length > 0} />
    </>
  );
}
