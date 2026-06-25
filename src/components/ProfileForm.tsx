"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { Field as UiField, Input } from "@/components/ui";
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
    // Validate display name: trimmed length must be 1–60 chars.
    const trimmed = displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 60) {
      setError(dict.account.displayNameInvalid);
      return;
    }
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
        .update({ display_name: trimmed })
        .eq("id", user.id);
      if (updErr) {
        setError(updErr.message || dict.auth.genericError);
        return;
      }
      // Keep auth metadata in sync for the nav greeting.
      await supabase.auth.updateUser({
        data: { display_name: trimmed },
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
        <p role="status" className="flex items-center gap-1.5 text-[13px] text-ok">
          <span aria-hidden="true">✓</span>
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
      <UiField
        htmlFor="email"
        label={dict.account.email}
        hint={dict.account.emailLocked}
      >
        <Input id="email" type="email" value={email} disabled />
      </UiField>
      <div>
        <SubmitButton pending={pending}>
          {pending ? dict.auth.processing : dict.account.save}
        </SubmitButton>
      </div>
    </form>
  );
}
