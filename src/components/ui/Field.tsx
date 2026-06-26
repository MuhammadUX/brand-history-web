import React from "react";
import { cn } from "./cn";

const CONTROL =
  "w-full rounded-md border border-line bg-surface-2 px-3 text-[14px] text-ink placeholder:text-muted transition-colors duration-150 focus:border-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:opacity-60";

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Field — label + control wrapper with hint/error slots. Pair with Input/
 * Textarea/Select. Pass `htmlFor` matching the control's id.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  // Deterministic message id (SSR-safe, no hooks) so the error/hint can be
  // linked to the control via aria-describedby. Requires htmlFor to be set.
  const msgId = htmlFor ? `${htmlFor}-msg` : undefined;

  // Auto-wire aria-describedby + aria-invalid onto the control when we have an
  // id and a message, without every call site having to repeat it.
  let control = children;
  if (msgId && (error || hint) && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      "aria-describedby"?: string;
      "aria-invalid"?: boolean | "true" | "false";
    }>;
    const existing = child.props["aria-describedby"];
    control = React.cloneElement(child, {
      "aria-describedby": existing ? `${existing} ${msgId}` : msgId,
      ...(error ? { "aria-invalid": true } : {}),
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="label text-ink">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {control}
      {error ? (
        <p id={msgId} className="text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-[12px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps) {
  return <input className={cn(CONTROL, "h-11", className)} {...rest} />;
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...rest }: TextareaProps) {
  return <textarea className={cn(CONTROL, "min-h-24 py-2.5", className)} {...rest} />;
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={cn(CONTROL, "h-11 font-semibold", className)} {...rest}>
      {children}
    </select>
  );
}

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  return (
    <label className={cn("flex items-start gap-2.5 text-[14px] text-ink", className)}>
      <input
        type="checkbox"
        id={id}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[4px] border-line text-ink accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export function Radio({ label, className, id, ...rest }: RadioProps) {
  return (
    <label className={cn("flex items-start gap-2.5 text-[14px] text-ink", className)}>
      <input
        type="radio"
        id={id}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 border-line accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export default Field;
