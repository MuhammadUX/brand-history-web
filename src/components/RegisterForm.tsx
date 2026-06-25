"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Checkbox } from "@/components/ui";
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: redirectTo,
        },
      });
      if (signUpError) {
        // Enumeration-safe: never reveal that an email already exists. Supabase
        // returns a "User already registered" error for existing accounts — fold
        // that into the same neutral confirmation shown on success. Genuine
        // validation errors (e.g. weak password) keep their distinct message.
        const msg = signUpError.message?.toLowerCase() ?? "";
        const isExistence =
          msg.includes("already registered") ||
          msg.includes("already been registered") ||
          msg.includes("user already exists");
        if (isExistence) {
          setDone(true);
          return;
        }
        setError(signUpError.message || dict.auth.genericError);
        return;
      }
      // When confirmations are enabled, Supabase returns a user with an empty
      // `identities` array for an already-existing email (no error). Treat that
      // as the same neutral confirmation so existence isn't revealed.
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setDone(true);
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
        <FormSuccess message={dict.auth.registerNeutral} />
        <p className="rounded-md border border-line bg-surface-2 px-4 py-3 text-[13px] leading-5 text-muted">
          {dict.auth.demoNote}
        </p>
        <Link
          href={`/${locale}/login`}
          className="text-[13px] font-semibold text-link hover:underline"
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
      <Checkbox
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        label={dict.auth.consent}
      />
      <p className="text-[12px] leading-5 text-muted">
        {dict.auth.consentReadMore}{" "}
        <Link
          href={`/${locale}/terms`}
          className="font-semibold text-link hover:underline"
        >
          {dict.footer.terms}
        </Link>{" "}
        {dict.auth.consentReadMoreAnd}{" "}
        <Link
          href={`/${locale}/privacy`}
          className="font-semibold text-link hover:underline"
        >
          {dict.footer.privacy}
        </Link>
        .
      </p>
      <SubmitButton pending={pending}>
        {pending ? dict.auth.processing : dict.auth.createAccount}
      </SubmitButton>
      <p className="text-center text-[13px] text-muted">
        {dict.auth.haveAccount}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-link hover:underline"
        >
          {dict.auth.signIn}
        </Link>
      </p>
    </form>
  );
}
