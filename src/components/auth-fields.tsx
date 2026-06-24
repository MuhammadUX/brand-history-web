"use client";

import type { InputHTMLAttributes } from "react";

const inputCls =
  "w-full rounded-btn border border-border bg-page px-4 py-2.5 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} className={inputCls} {...props} />
    </div>
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
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-btn bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded-card border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
    >
      {message}
    </div>
  );
}
