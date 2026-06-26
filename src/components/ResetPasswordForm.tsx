"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field, FormError, FormSuccess, SubmitButton } from "./auth-fields";

export default function ResetPasswordForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  // null = still establishing the recovery session, true = ready, false = link invalid.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Establish the recovery session from the reset link. With @supabase/ssr the
  // flow is PKCE: the link returns a `?code=` that must be exchanged for a
  // session. We also support the legacy hash/implicit flow and an
  // already-detected session, and only declare the link invalid AFTER trying.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });

    (async () => {
      const url = new URL(window.location.href);
      // Explicit error returned by Supabase (e.g. expired/used link).
      if (url.searchParams.get("error_description") || url.hash.includes("error")) {
        if (active) setHasSession(false);
        return;
      }
      // PKCE: exchange the code for a session.
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (active) setHasSession(!exErr);
        return;
      }
      // Already have a session (hash/implicit auto-detected, or signed in)?
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (active) setHasSession(true);
        return;
      }
      // Give the client a moment to parse a hash-based recovery, then re-check.
      setTimeout(async () => {
        if (!active) return;
        const { data: d2 } = await supabase.auth.getSession();
        setHasSession(!!d2.session);
      }, 800);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(dict.auth.passwordTooShort);
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message || dict.auth.genericError);
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
        <FormSuccess message={dict.auth.resetSuccess} />
        <Link
          href={`/${locale}/login`}
          className="text-[13px] font-semibold text-link hover:underline"
        >
          {dict.auth.signIn}
        </Link>
      </div>
    );
  }

  // Still establishing the session — don't show the form (or a false "invalid") yet.
  if (hasSession === null) {
    return (
      <p className="text-[13px] leading-5 text-muted" role="status">
        {dict.auth.processing}
      </p>
    );
  }

  if (hasSession === false) {
    return (
      <div className="flex flex-col gap-4">
        <FormError message={dict.auth.resetInvalid} />
        <Link
          href={`/${locale}/forgot-password`}
          className="text-[13px] font-semibold text-link hover:underline"
        >
          {dict.auth.forgotTitle}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <FormError message={error} />}
      <Field
        id="password"
        label={dict.auth.newPassword}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={dict.auth.passwordPlaceholder}
        required
      />
      <SubmitButton pending={pending}>
        {pending ? dict.auth.processing : dict.auth.updatePassword}
      </SubmitButton>
    </form>
  );
}
