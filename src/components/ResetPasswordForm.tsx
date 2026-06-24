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
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Supabase places a recovery session via the URL hash; confirm it's present.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });
    return () => sub.subscription.unsubscribe();
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
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {dict.auth.signIn}
        </Link>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="flex flex-col gap-4">
        <FormError message={dict.auth.resetInvalid} />
        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm font-semibold text-primary hover:text-primary-hover"
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
