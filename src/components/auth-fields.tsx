"use client";

import type { InputHTMLAttributes } from "react";
import {
  Field as DsField,
  Input,
  Button,
} from "@/components/ds";

export function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <DsField label={label} htmlFor={id}>
      <Input id={id} {...props} />
    </DsField>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending}
      className="w-full"
    >
      {children}
    </Button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border border-danger bg-surface px-3 py-2 font-mono text-[13px] text-danger"
    >
      <span aria-hidden="true" className="me-1">
        ⚠
      </span>
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="border border-hairline bg-surface px-4 py-3 font-mono text-[13px] text-ink"
    >
      <span aria-hidden="true" className="me-1">
        [ ✓ ]
      </span>
      {message}
    </div>
  );
}
