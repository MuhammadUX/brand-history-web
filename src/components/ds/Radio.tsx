import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Optional mono label rendered beside the box. */
  label?: string;
}

/**
 * Radio — 1-bit sharp radio. A visually-hidden native input drives a custom
 * 18px ink-bordered box; when selected an inner ink SQUARE (not a circle)
 * snaps in (hard steps(1) cut, no slide).
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, label, disabled, ...rest },
  ref,
) {
  return (
    <label
      className={cn(
        "group inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className="sr-only peer"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          "rounded-none border border-ink bg-paper",
          "peer-disabled:border-hairline peer-disabled:bg-surface",
          // inner 1-bit square: hidden until the peer input is checked
          "after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-[8px]",
          "after:-translate-x-1/2 after:-translate-y-1/2 after:bg-ink after:opacity-0 after:content-['']",
          "peer-checked:after:opacity-100",
        )}
      />
      {label && (
        <span
          className={cn(
            "font-mono text-[13px] leading-none",
            disabled ? "text-metadata" : "text-ink",
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
});
