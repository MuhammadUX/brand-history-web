"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * RouteTransition · R1 scanline-wipe on route change.
 * Mounts a fixed full-viewport `.mo-scanline` overlay (1px ink line sweeping
 * top→bottom, steps(12)) for ~160ms on each pathname change, then unmounts.
 * Honors reduced motion (no overlay). Safe to wrap layout children.
 */

const WIPE_MS = 160;

export interface RouteTransitionProps {
  children: React.ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [wiping, setWiping] = useState(false);
  const timerRef = useRef<number | null>(null);
  // Skip the very first mount so we only wipe on actual navigations.
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (prefersReducedMotion()) return;

    setWiping(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setWiping(false);
      timerRef.current = null;
    }, WIPE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <>
      {children}
      {wiping ? (
        <div aria-hidden="true" className="mo-scanline" />
      ) : null}
    </>
  );
}
