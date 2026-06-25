"use client";

import React from "react";
import { cn } from "./cn";
import { useTypeOn } from "@/lib/motion";

export interface TypeOnProps {
  /** The text to type on (primary heading only). */
  text: string;
  /** Element to render as. Default h1. */
  as?: "h1" | "h2" | "span";
  /** ms per character (default 16). */
  speed?: number;
  /** cap — longer strings appear instantly (default 28). */
  maxChars?: number;
  className?: string;
}

/**
 * TypeOn (M3) — mono/display heading types on char-by-char with a single block
 * caret blinking at a stepped 1Hz. Caret stops on completion. Reduced motion =
 * instant full string. Use ONLY for a page's primary heading.
 */
export function TypeOn({
  text,
  as = "h1",
  speed,
  maxChars,
  className,
}: TypeOnProps) {
  const { text: shown, done } = useTypeOn(text, { speed, maxChars });
  const Tag = as;
  return (
    <Tag
      className={cn("font-display", !done && "mo-caret", className)}
      aria-label={text}
    >
      <span aria-hidden={!done}>{shown}</span>
    </Tag>
  );
}

export default TypeOn;
