"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Modal — centered scrim dialog. Escape and scrim-click close it; body scroll
 * is locked while open. Renders nothing when closed. Client component
 * (keydown listener, body-scroll lock). Pass a string `title` for the
 * accessible name.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;

    // Remember what was focused so we can restore it on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      const root = dialogRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    // Move focus into the dialog.
    const focusables = getFocusable();
    (focusables[0] ?? dialogRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // Trap focus within the dialog.
        const items = getFocusable();
        if (items.length === 0) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // Restore focus to the trigger.
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const ariaLabel = typeof title === "string" ? title : undefined;

  return (
    <div
      className="lib-fade fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(20,18,12,.55)] p-5"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[440px] overflow-hidden rounded-lg bg-surface shadow-modal focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start gap-3 px-[22px] pt-[18px]">
          <div className="min-w-0 flex-1">
            {eyebrow ? <div className="label">{eyebrow}</div> : null}
            {title ? (
              <h2 className="text-[16px] font-bold text-ink">{title}</h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-muted hover:text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            ✕
          </button>
        </div>
        <div className="px-[22px] py-[18px]">{children}</div>
        {footer ? (
          <div className="border-t border-line px-[22px] py-[14px]">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
