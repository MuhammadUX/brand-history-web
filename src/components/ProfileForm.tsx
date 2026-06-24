"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field, FormError, SubmitButton } from "./auth-fields";

export default function ProfileForm({
  locale,
  email,
  initialDisplayName,
}: {
  locale: Locale;
  email: string;
  initialDisplayName: string;
}) {
  const dict = getDictionary(locale);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(dict.auth.genericError);
        return;
      }
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
      if (updErr) {
        setError(updErr.message || dict.auth.genericError);
        return;
      }
      // Keep auth metadata in sync for the nav greeting.
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      setSaved(true);
    } catch {
      setError(dict.auth.genericError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4" noValidate>
      {error && <FormError message={error} />}
      {saved && (
        <p role="status" className="text-sm font-medium text-success">
          {dict.account.saved}
        </p>
      )}
      <Field
        id="displayName"
        label={dict.account.displayName}
        type="text"
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          setSaved(false);
        }}
        autoComplete="name"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {dict.account.email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full rounded-btn border border-border bg-page px-4 py-2.5 text-sm text-tertiary"
        />
        <p className="text-xs text-tertiary">{dict.account.emailLocked}</p>
      </div>
      <div>
        <SubmitButton pending={pending}>
          {pending ? dict.auth.processing : dict.account.save}
        </SubmitButton>
      </div>
    </form>
  );
}
