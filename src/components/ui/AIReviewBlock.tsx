import React from "react";
import { cn } from "./cn";

export type Confidence = "high" | "medium" | "low";

const CONFIDENCE: Record<Confidence, string> = {
  high: "text-ok border-[#bfe6cd] bg-[#eef9f1]",
  medium: "text-amber border-amber-line bg-amber-bg",
  low: "text-muted border-line bg-surface-2",
};

export interface ConfidencePillProps {
  confidence: Confidence;
  className?: string;
}

/**
 * ConfidencePill — small colored pill conveying AI draft confidence:
 * high (green) / medium (amber) / low (neutral).
 */
export function ConfidencePill({ confidence, className }: ConfidencePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.03em]",
        CONFIDENCE[confidence],
        className,
      )}
    >
      {confidence}
    </span>
  );
}

export interface AIReviewBlockProps {
  title: React.ReactNode;
  confidence?: Confidence;
  source?: React.ReactNode;
  conflict?: boolean;
  accepted?: boolean;
  rejected?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * AIReviewBlock — a review card for an AI-drafted field. Shows the field title,
 * a confidence pill, an optional conflict flag, the drafted body, and a footer
 * with source + accept/reject actions. Accepted gets an ok ring; rejected dims.
 * Server component.
 */
export function AIReviewBlock({
  title,
  confidence,
  source,
  conflict = false,
  accepted = false,
  rejected = false,
  actions,
  children,
  className,
}: AIReviewBlockProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface p-4 shadow-card",
        accepted && "ring-1 ring-ok/40",
        rejected && "opacity-60",
        className,
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold uppercase tracking-label text-muted">
          {title}
        </span>
        {confidence ? <ConfidencePill confidence={confidence} /> : null}
        {conflict ? (
          <span className="inline-flex items-center rounded-md border border-amber-line bg-amber-bg px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-[0.03em] text-amber">
            Conflict
          </span>
        ) : null}
      </div>
      <div className="text-[14px] text-ink">{children}</div>
      {source || actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {source ? (
            <span className="label text-muted">Source: {source}</span>
          ) : null}
          {actions ? (
            <span className="ms-auto inline-flex items-center gap-2">{actions}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default AIReviewBlock;
