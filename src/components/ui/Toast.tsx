"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface ToastProps {
  message: string;
  visible: boolean;
  className?: string;
}

/**
 * Toast — controlled, RTL-safe status pill anchored bottom-center. Drive it
 * with the useToast() hook. Client component (transition state).
 */
export function Toast({ message, visible, className }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 start-0 end-0 z-[100] mx-auto w-fit rounded-pill bg-ink px-5 py-2.5 text-[13px] font-semibold text-white shadow-pop transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
    >
      {message}
    </div>
  );
}

export interface UseToastReturn {
  message: string;
  visible: boolean;
  show: (msg: string, ms?: number) => void;
}

/**
 * useToast — minimal toast controller. `show(msg, ms?)` displays a message for
 * `ms` (default 1500ms) then hides it. SSR-safe; clears its timer on unmount.
 */
export function useToast(): UseToastReturn {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const show = useCallback((msg: string, ms = 1500) => {
    setMessage(msg);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), ms);
  }, []);

  return { message, visible, show };
}

export default Toast;
