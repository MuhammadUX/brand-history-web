"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field, FormError, FormSuccess, SubmitButton } from "./auth-fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!displayName.trim() || !email.trim() || !password) {
      setError(dict.auth.required);
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError(dict.auth.invalidEmail);
      return;
    }
    if (password.length < 8) {
      setError(dict.auth.passwordTooShort);
      return;
    }
    if (!consent) {
      setError(dict.auth.consentRequired);
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/${locale}/verify-email`
          : undefined;
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: redirectTo,
        },
      });
      if (signUpError) {
        setError(signUpError.message || dict.auth.genericError);
        return;
      }
      setDone(true);
    } catch {
      setError(dict.auth.genericError);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess message={`${dict.auth.checkInboxTitle} — ${dict.auth.checkInboxBody}`} />
        <p className="rounded-card border border-border bg-page px-4 py-3 text-sm text-secondary">
          {dict.auth.demoNote}
        </p>
        <Link
          href={`/${locale}/login`}
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.signIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <FormError message={error} />}
      <Field
        id="displayName"
        label={dict.auth.displayName}
        type="text"
        autoComplete="name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={dict.auth.displayNamePlaceholder}
        required
      />
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
      <Field
        id="password"
        label={dict.auth.password}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={dict.auth.passwordPlaceholder}
        required
      />
      <label className="flex items-start gap-2.5 text-sm text-secondary">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>{dict.auth.consent}</span>
      </label>
      <SubmitButton pending={pending}>
        {pending ? dict.auth.processing : dict.auth.createAccount}
      </SubmitButton>
      <p className="text-center text-sm text-secondary">
        {dict.auth.haveAccount}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.signIn}
        </Link>
      </p>
    </form>
  );
}
