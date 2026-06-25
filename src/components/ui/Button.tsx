import React from "react";
import Link from "next/link";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill border font-semibold text-center transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-white hover:bg-black",
  ghost: "border-line bg-transparent text-ink hover:bg-surface-2",
  danger: "border-transparent bg-danger text-white hover:brightness-95",
};

// All sizes clear the 44px minimum target.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3 text-[13px]",
  md: "min-h-[44px] px-[18px] text-[13.5px]",
  lg: "min-h-[48px] px-6 text-[15px]",
};

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export type ButtonProps =
  | (StyleProps &
      Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
        href?: undefined;
      })
  | (StyleProps &
      Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
        /** When set, the Button renders as a Next.js <Link>. */
        href: string;
      });

/**
 * Button — Library control. primary (ink), ghost (hairline), danger.
 * Renders as a <Link> when `href` is set, otherwise a <button>. 44px min height.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant = "primary", size = "md", className, href, children, ...rest } =
      props;
    return (
      <Link href={href} className={classesFor(variant, size, className)} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  return (
    <button className={classesFor(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export default Button;
