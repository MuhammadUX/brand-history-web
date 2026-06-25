"use client";

import React, { useCallback, useState } from "react";
import { cn } from "./cn";
import { typeOnToast } from "@/lib/motion";

export interface ToastProps {
  /** The message to announce. Empty string renders an empty (but live) region. */
  message: string;
  /** Show the pill. When false, an empty live region is still rendered. */
  visible?: boolean;
  className?: string;
}

/**
 * Toast — ink pill confirmation. Mono message with a `[ ✓ ]` tick prefix.
 * Always renders a `role="status"` live region (even when not visible) so
 * screen readers still announce. Sharp 0px, fixed bottom-center by default
 * (overridable via className). Pairs with `useToast` / `typeOnToast`.
 */
export function Toast({ message, visible = true, className }: ToastProps) {
  const shown = visible && message.length > 0;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center",
        className,
      )}
    >
      {shown && (
        <span
          className={cn(
            "mo-stamp inline-flex items-center gap-1 rounded-none bg-ink px-2 py-1.5",
            "font-mono text-[11px] uppercase tracking-label text-paper",
          )}
        >
          <span aria-hidden="true">[</span>
          <span aria-hidden="true">✓</span>
          <span aria-hidden="true">]</span>
          <span className="ms-1 normal-case tracking-normal">{message}</span>
        </span>
      )}
    </div>
  );
}

export interface UseToastReturn {
  /** Current staged message ("" when idle / after hard-cut). */
  message: string;
  /** Type a message on, hold, then hard-cut to empty. */
  show: (msg: string) => void;
}

/**
 * useToast — drives a `Toast` live region. `show(msg)` stages the message
 * type-on frames into state via `typeOnToast`, then hard-cuts to "" after the
 * hold. Dependency-free. Reduced motion shows instantly then clears.
 */
export function useToast(): UseToastReturn {
  const [message, setMessage] = useState("");

  const show = useCallback((msg: string) => {
    // typeOnToast stages frames via the callback, then hard-cuts to "".
    void typeOnToast(msg, setMessage);
  }, []);

  return { message, show };
}
