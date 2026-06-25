"use client";

/**
 * Concept A motion layer — stepped, 1-bit, instrument-like.
 * Dependency-free: CSS @keyframes (globals.css) + Web Animations API.
 *
 * Every effect is entry-only or feedback-only and degrades to its instant,
 * truthful end state under prefers-reduced-motion. The hooks below no-op
 * (and apply the final state) when reduced motion is requested.
 */
import { useEffect, useRef, useState, type RefObject } from "react";

/** Read the prefers-reduced-motion preference (SSR-safe; false on server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Reactive version of prefersReducedMotion for components. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/**
 * M1 · useDevelopIn — IntersectionObserver-driven "develop-in" trigger.
 * Returns a ref + a boolean. Add the `mo-develop` class when `developed` is
 * true. Under reduced motion it returns true immediately (final state).
 */
export function useDevelopIn<T extends Element = HTMLDivElement>(options?: {
  /** Only fire once (default true). */
  once?: boolean;
  /** rootMargin for the observer. */
  rootMargin?: string;
}): { ref: RefObject<T | null>; developed: boolean } {
  const ref = useRef<T | null>(null);
  const [developed, setDeveloped] = useState(false);
  const once = options?.once ?? true;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDeveloped(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setDeveloped(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDeveloped(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setDeveloped(false);
          }
        }
      },
      { rootMargin: options?.rootMargin ?? "0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, options?.rootMargin]);

  return { ref, developed };
}

/**
 * M3 · useTypeOn — terminal type-on for a single primary heading.
 * Reveals `text` char-by-char (~16ms/char). Caps at `maxChars` (28); longer
 * strings appear instantly. Reduced motion = instant full string.
 */
export function useTypeOn(
  text: string,
  opts?: { speed?: number; maxChars?: number },
): { text: string; done: boolean } {
  const speed = opts?.speed ?? 16;
  const maxChars = opts?.maxChars ?? 28;
  const [shown, setShown] = useState(text);
  const [done, setDone] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion() || text.length > maxChars) {
      setShown(text);
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, maxChars]);

  return { text: shown, done };
}

/**
 * M4 · useCountUp — tabular count-up to a final integer in stepped notches
 * (~6–8 states over ~220ms). Reduced motion writes the final value instantly.
 */
export function useCountUp(
  value: number,
  opts?: { duration?: number; steps?: number },
): number {
  const duration = opts?.duration ?? 220;
  const steps = opts?.steps ?? 8;
  const [n, setN] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    let frame = 0;
    const start = 0;
    const id = window.setInterval(() => {
      frame += 1;
      const t = frame / steps;
      setN(Math.round(start + (value - start) * t));
      if (frame >= steps) {
        window.clearInterval(id);
        setN(value);
      }
    }, duration / steps);
    return () => window.clearInterval(id);
  }, [value, duration, steps]);

  return n;
}

/**
 * M7 · fireTick — fire a one-shot registration-tick "lock" blink on an element
 * via the Web Animations API (no leftover class). Honors reduced motion.
 */
export function fireTick(el: Element | null) {
  if (!el || prefersReducedMotion()) return;
  if (!("animate" in el)) return;
  (el as HTMLElement).animate(
    [
      { background: "transparent", color: "inherit" },
      { background: "var(--ink)", color: "var(--paper)", offset: 0.5 },
      { background: "transparent", color: "inherit" },
    ],
    { duration: 80, easing: "steps(1)", iterations: 1 },
  );
}

/**
 * Copy-to-toast: type-on then hard-cut. Returns the staged label string via a
 * callback as it types. Pairs with a role="status" live region. Reduced motion
 * shows the full message instantly, holds, then clears.
 */
export async function typeOnToast(
  msg: string,
  onFrame: (s: string) => void,
  opts?: { perChar?: number; hold?: number },
): Promise<void> {
  const perChar = opts?.perChar ?? 30;
  const hold = opts?.hold ?? 1200;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  if (prefersReducedMotion()) {
    onFrame(msg);
    await wait(hold);
    onFrame("");
    return;
  }
  let acc = "";
  for (const ch of msg) {
    acc += ch;
    onFrame(acc);
    await wait(perChar);
  }
  await wait(hold);
  onFrame(""); // hard cut, no fade
}

/** Bayer 4×4 ordered-dither threshold matrix (normalized 0..1). */
export const BAYER_4x4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));
