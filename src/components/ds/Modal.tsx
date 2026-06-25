"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Mono eyebrow above the title, e.g. "[ CONFIRM ]". */
  eyebrow?: string;
  children?: React.ReactNode;
  /** Footer slot — wrap actions in <ButtonGroup align="end">. */
  footer?: React.ReactNode;
  /** Optional labelled info/ad rail flush to the panel (with-side-rail). */
  sideRail?: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * Modal — CENTERED overlay. Fixed-inset scrim (ink @45%) + a panel centred via
 * flex (items-center justify-center). Focus-trap, Esc-close, focus restore,
 * role="dialog" aria-modal. This replaces every hand-placed / left-aligned
 * dialog — the single source of truth for overlays.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  sideRail,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(
    `modal-title-${Math.random().toString(36).slice(2, 8)}`,
  ).current;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus first focusable (or panel)
    const t = window.setTimeout(() => {
      const node = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (node ?? panelRef.current)?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      restoreRef.current?.focus?.();
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-2"
      style={{ background: "rgba(10,10,10,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] max-w-[min(92vw,640px)] items-stretch">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "flex w-full flex-col overflow-auto border border-ink bg-surface p-3 outline-none",
            className,
          )}
        >
          {eyebrow && (
            <span className="label-mono mb-1 text-metadata">{eyebrow}</span>
          )}
          <h2 id={titleId} className="text-2xl leading-tight text-ink">
            {title}
          </h2>
          {children && (
            <div className="mt-2 font-mono text-[15px] leading-6 text-ink-700">
              {children}
            </div>
          )}
          {footer && (
            <>
              <div className="my-2 h-px w-full bg-hairline" />
              <div className="flex justify-end">{footer}</div>
            </>
          )}
        </div>
        {sideRail && (
          <aside className="hidden w-48 shrink-0 border-y border-e border-hairline bg-paper p-2 sm:block">
            {sideRail}
          </aside>
        )}
      </div>
    </div>
  );
}

export default Modal;
