import React from "react";
import Link from "next/link";
import { cn } from "./cn";

export interface SectionHeaderProps {
  title: React.ReactNode;
  /** Optional eyebrow label above the title. */
  kicker?: React.ReactNode;
  /** Optional "view all" link (gold) on the trailing side. */
  actionHref?: string;
  actionLabel?: React.ReactNode;
  /** Or supply arbitrary trailing content. */
  action?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * SectionHeader — baseline-aligned title row with an optional gold "view all"
 * action. Used to head shelves and profile sections.
 */
export function SectionHeader({
  title,
  kicker,
  actionHref,
  actionLabel,
  action,
  as: Tag = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-baseline justify-between gap-4", className)}>
      <div>
        {kicker && <div className="label mb-1.5">{kicker}</div>}
        <Tag className="m-0 text-[15px] font-bold tracking-tight text-ink">
          {title}
        </Tag>
      </div>
      {action ??
        (actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="shrink-0 text-[13px] font-semibold text-link hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null)}
    </div>
  );
}

export default SectionHeader;
