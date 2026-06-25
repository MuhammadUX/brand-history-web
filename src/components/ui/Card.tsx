import React from "react";
import { cn } from "./cn";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "title"> {
  /** Optional uppercase label header rendered at the top of the card. */
  title?: React.ReactNode;
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Card — white surface, warm hairline, soft 14px radius, whisper elevation.
 * The Library's primary content container.
 */
export function Card({
  title,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface shadow-card",
        padded && "p-[22px]",
        className,
      )}
      {...rest}
    >
      {title && (
        <h3 className="mb-3.5 text-[13px] font-bold uppercase tracking-label text-muted">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export default Card;
