"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field, FormError, SubmitButton } from "./auth-fields";

export default function LoginForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || `/${locale}/account`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError(dict.auth.required);
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(dict.auth.wrongCreds);
        setPending(false);
        return;
      }
      // Full navigation so middleware/server pick up the new session cookie.
      router.replace(next);
      router.refresh();
    } catch {
      setError(dict.auth.genericError);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <FormError message={error} />}
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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            {dict.auth.password}
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-xs font-medium text-primary hover:text-primary-hover"
          >
            {dict.auth.forgotPassword}
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-btn border border-border bg-page px-4 py-2.5 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
      <SubmitButton pending={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </SubmitButton>
      <p className="text-center text-xs text-tertiary">{dict.auth.demoHint}</p>
      <p className="text-center text-sm text-secondary">
        {dict.auth.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.register}
        </Link>
      </p>
    </form>
  );
}
