import React from "react";
import { cn } from "./cn";
import type { BrandGuideline } from "@/lib/types";

export interface UsageRulesProps {
  clearSpace?: string | null;
  minSize?: string | null;
  guidelines?: BrandGuideline[];
  isAr?: boolean;
  /** i18n labels. */
  labels: {
    heading: string;
    clearSpace: string;
    minSize: string;
    do: string;
    dont: string;
  };
  className?: string;
}

function GuidelineItem({
  kind,
  text,
}: {
  kind: "do" | "dont";
  text: React.ReactNode;
}) {
  const isDo = kind === "do";
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[11px] font-bold leading-none",
          isDo
            ? "border-[#bfe6cd] bg-[#eef9f1] text-ok"
            : "border-[#e7c1c3] bg-[#fbeced] text-danger",
        )}
      >
        {isDo ? "✓" : "✕"}
      </span>
      <span className="text-[13px] leading-snug text-ink">{text}</span>
    </li>
  );
}

/**
 * UsageRules — logo usage governance: clear-space + min-size facts and a
 * Do / Don't grid (green do, red don't). Renders nothing when there is no data
 * at all (honest empty). Server component.
 */
export function UsageRules({
  clearSpace,
  minSize,
  guidelines = [],
  isAr = false,
  labels,
  className,
}: UsageRulesProps) {
  const dos = guidelines.filter((g) => g.kind === "do");
  const donts = guidelines.filter((g) => g.kind === "dont");
  const hasFacts = Boolean(clearSpace || minSize);
  const hasGuidelines = dos.length > 0 || donts.length > 0;

  if (!hasFacts && !hasGuidelines) return null;

  const textOf = (g: BrandGuideline) =>
    (isAr ? g.text_ar : g.text_en) || g.text_en;

  return (
    <div className={cn("mt-5 border-t border-line pt-5", className)}>
      <h4 className="label mb-3">{labels.heading}</h4>

      {hasFacts ? (
        <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {clearSpace ? (
            <div className="rounded-md border border-line bg-surface-2 px-3.5 py-2.5">
              <dt className="label mb-0.5">{labels.clearSpace}</dt>
              <dd className="text-[13px] font-semibold text-ink">{clearSpace}</dd>
            </div>
          ) : null}
          {minSize ? (
            <div className="rounded-md border border-line bg-surface-2 px-3.5 py-2.5">
              <dt className="label mb-0.5">{labels.minSize}</dt>
              <dd className="text-[13px] font-semibold text-ink">{minSize}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {hasGuidelines ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {dos.length > 0 ? (
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.04em] text-ok">
                {labels.do}
              </p>
              <ul className="flex flex-col gap-2">
                {dos.map((g) => (
                  <GuidelineItem key={g.id} kind="do" text={textOf(g)} />
                ))}
              </ul>
            </div>
          ) : null}
          {donts.length > 0 ? (
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.04em] text-danger">
                {labels.dont}
              </p>
              <ul className="flex flex-col gap-2">
                {donts.map((g) => (
                  <GuidelineItem key={g.id} kind="dont" text={textOf(g)} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default UsageRules;
