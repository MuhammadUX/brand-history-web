import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";

/* -------------------------------------------------------------------------- */
/*  Input                                                                     */
/* -------------------------------------------------------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Renders the control in an error tone (danger hairline). */
  error?: boolean;
}

/**
 * Input — sharp, hairline-bordered mono text field.
 * 48px tall, surface fill, focus drives the border to ink.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error = false, disabled, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={error || undefined}
      className={cn(
        "h-12 w-full rounded-none bg-surface px-3",
        "font-mono text-[13px] text-ink tabular-nums",
        "border border-hairline",
        "placeholder:text-metadata",
        "outline-none transition-none",
        // focus → ink border (global focus ring handles the offset outline)
        "focus:border-ink",
        // error tone
        error && "border-danger focus:border-danger",
        // disabled tone
        disabled &&
          "cursor-not-allowed border-hairline text-metadata placeholder:text-metadata",
        className,
      )}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------- */
/*  Field                                                                     */
/* -------------------------------------------------------------------------- */

export type FieldState = "default" | "focus" | "error" | "disabled";

export interface FieldProps {
  /** Visible mono uppercase label above the control. */
  label: string;
  /** Associates the label with the control. */
  htmlFor?: string;
  /** Error message — when present, overrides the hint and tints danger. */
  error?: string;
  /** Helper text shown in metadata tone when there is no error. */
  hint?: string;
  /** Appends a required marker to the label. */
  required?: boolean;
  /** Tone of the label only. */
  state?: FieldState;
  /** The control (e.g. an <Input />). */
  children: ReactNode;
}

/**
 * Field — labelled wrapper for a single control. Stacks a mono uppercase
 * label, the control, and an optional helper / error line.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  state = "default",
  children,
}: FieldProps) {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className={cn(
          "label-mono",
          state === "error" || hasError ? "text-danger" : "text-ink",
          state === "disabled" && "text-metadata",
        )}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-danger">
            *
          </span>
        )}
      </label>

      {children}

      {hasError ? (
        <p
          role="alert"
          className="font-mono text-[11px] leading-tight text-danger"
        >
          <span aria-hidden="true" className="me-1">
            ⚠
          </span>
          {error}
        </p>
      ) : hint ? (
        <p className="font-mono text-[11px] leading-tight text-metadata">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
