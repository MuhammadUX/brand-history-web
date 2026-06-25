import React from "react";
import Link from "next/link";
import { cn } from "./cn";

const CHIP_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-3 py-1.5 text-[12px] font-semibold leading-none transition-colors duration-150";
const CHIP_IDLE =
  "border-line bg-surface-2 text-muted hover:border-muted";
const CHIP_ON = "border-ink bg-ink text-white";

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "className"> {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Chip — static pill label (sector, meta). Use `active` for the selected look.
 * Non-interactive by default; for navigation use FilterChip.
 */
export function Chip({ active = false, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(CHIP_BASE, active ? CHIP_ON : CHIP_IDLE, "cursor-default", className)}
      {...rest}
    >
      {children}
    </span>
  );
}

export interface FilterChipProps {
  active?: boolean;
  /** When set, renders as a navigating <Link>. */
  href?: string;
  onClick?: () => void;
  "aria-current"?: React.AriaAttributes["aria-current"];
  className?: string;
  children: React.ReactNode;
}

/**
 * FilterChip — interactive facet/sector chip. Renders a <Link> when `href` is
 * provided (server-friendly), otherwise a <button> (client). Filled when active.
 */
export function FilterChip({
  active = false,
  href,
  onClick,
  className,
  children,
  ...rest
}: FilterChipProps) {
  const classes = cn(
    CHIP_BASE,
    "cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
    active ? CHIP_ON : CHIP_IDLE,
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Chip;
