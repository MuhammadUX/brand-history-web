import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Optional mono label rendered beside the box. */
  label?: string;
}

/**
 * Checkbox — 1-bit sharp checkbox. A visually-hidden native input drives a
 * custom 18px ink-bordered box; when checked the box fills ink and a paper
 * "×" snaps in (no slide — a hard steps(1) cut).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, label, disabled, ...rest }, ref) {
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
          type="checkbox"
          disabled={disabled}
          className="sr-only peer"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center",
            "rounded-none border border-ink bg-paper",
            "peer-checked:bg-ink",
            "peer-disabled:border-hairline peer-disabled:bg-surface",
            // 1-bit ×: hidden by default, snaps in when the peer input is checked
            "after:pointer-events-none after:absolute after:inset-0 after:flex after:items-center after:justify-center",
            "after:font-mono after:text-[13px] after:leading-none after:text-paper after:content-['']",
            "peer-checked:after:content-['×']",
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
  },
);
