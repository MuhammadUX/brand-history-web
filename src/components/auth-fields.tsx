"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Field as UiField, Input, Button } from "@/components/ui";

export function Field({
  id,
  label,
  error,
  hint,
  required,
  ...props
}: {
  id: string;
  label: string;
  error?: ReactNode;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <UiField
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      required={required}
    >
      <Input id={id} required={required} {...props} />
    </UiField>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {children}
    </Button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-[13px] text-ink"
    >
      <span aria-hidden="true" className="text-ok">
        ✓
      </span>
      <span>{message}</span>
    </div>
  );
}
