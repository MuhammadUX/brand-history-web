import React from "react";
import { cn } from "./cn";

export type ButtonType = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment. Exactly one `primary` per screen. */
  variant?: ButtonType;
  size?: ButtonSize;
}

const VARIANT: Record<ButtonType, string> = {
  // filled ink + paper label
  primary:
    "bg-ink text-paper border border-ink hover:bg-ink-700 hover:border-ink-700",
  // 1px ink border, no fill → inverts to ink on hover (stepped)
  secondary:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  // no border, ink label → ink fill / paper label on hover (border-draw→fill→invert)
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-ink hover:text-paper",
  // 1px danger border + danger label → danger fill on hover
  danger:
    "bg-transparent text-danger border border-danger hover:bg-danger hover:text-paper",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-10 px-2 text-[11px]", // h40 / padX16
  sm: "h-8 px-1.5 text-[11px]", // h32 / padX12
};

/**
 * Button — mono UPPERCASE, centered, sharp 0px, hairline borders.
 * Disabled renders a `⊘` prefix with hairline border + metadata label.
 * Hover inversion is stepped (mo-invert) — no grey crossfade. Press offsets 1px.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", className, children, disabled, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-none font-mono font-medium uppercase tracking-label",
          "mo-invert mo-press select-none",
          "disabled:cursor-not-allowed disabled:border-hairline disabled:bg-transparent disabled:text-metadata disabled:hover:bg-transparent disabled:hover:text-metadata",
          SIZE[size],
          VARIANT[variant],
          className,
        )}
        {...rest}
      >
        {disabled && <span aria-hidden="true">⊘</span>}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Align the row (e.g. modal footers end-align). */
  align?: "start" | "center" | "end";
}

/**
 * ButtonGroup / ActionRow — horizontal auto-layout, gap 12. Any time ≥2
 * buttons sit in a row, wrap them here; never hand-space. RTL-safe (flex flips).
 */
export function ButtonGroup({
  children,
  className,
  align = "start",
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
