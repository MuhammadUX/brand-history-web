"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field, FormSuccess, SubmitButton } from "./auth-fields";

export default function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/${locale}/reset-password`
          : undefined;
      // Enumeration-safe: ignore the result; always show the same message.
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
    } catch {
      /* swallow — enumeration-safe */
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess message={dict.auth.forgotSent} />
        <Link
          href={`/${locale}/login`}
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        id="email"
        label={dict.auth.email}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.auth.emailPlaceholder}
        required
      />
      <SubmitButton pending={pending}>
        {pending ? dict.auth.processing : dict.auth.sendResetLink}
      </SubmitButton>
      <p className="text-center text-sm text-secondary">
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.backToLogin}
        </Link>
      </p>
    </form>
  );
}
