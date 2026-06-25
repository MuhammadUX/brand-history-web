"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary, safeNext } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Input } from "@/components/ds";
import { Field, FormError, SubmitButton } from "./auth-fields";

export default function LoginForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), locale);

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label-mono text-ink">
            {dict.auth.password}
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="label-mono text-metadata hover:text-ink"
          >
            {dict.auth.forgotPassword}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <SubmitButton pending={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </SubmitButton>
      <p className="text-center font-mono text-[11px] text-metadata">
        {dict.auth.demoHint}
      </p>
      <p className="text-center font-mono text-[13px] text-ink-700">
        {dict.auth.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="text-ink underline hover:no-underline"
        >
          {dict.auth.register}
        </Link>
      </p>
    </form>
  );
}
