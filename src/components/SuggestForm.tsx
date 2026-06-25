"use client";

import { useActionState } from "react";
import { submitSuggestion, type SuggestState } from "@/app/[locale]/suggest/actions";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Field, Input, Button } from "@/components/ds";

interface SuggestFormProps {
  locale: Locale;
}

const initialState: SuggestState = { status: "idle" };

export default function SuggestForm({ locale }: SuggestFormProps) {
  const dict = getDictionary(locale);
  const action = submitSuggestion.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.status === "success") {
    return (
      <div className="border border-hairline bg-surface p-8 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center border border-ink font-display text-ink"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
          {dict.suggest.successTitle}
        </h2>
        <p className="mt-2 font-mono text-[13px] leading-5 text-ink-700">
          {dict.suggest.successBody}
        </p>
        <a
          href={`/${locale}/suggest`}
          className="mo-invert mo-press mt-6 inline-flex h-10 items-center justify-center whitespace-nowrap border border-ink bg-transparent px-4 font-mono text-[11px] font-medium uppercase tracking-label text-ink hover:bg-ink hover:text-paper"
        >
          {dict.suggest.addAnother}
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 border border-hairline bg-surface p-6"
    >
      {state.status === "error" && (
        <p
          role="alert"
          className="border border-danger bg-surface px-4 py-2.5 font-mono text-[13px] text-danger"
        >
          <span aria-hidden="true" className="me-1">
            ⚠
          </span>
          {state.message === "required"
            ? dict.suggest.required
            : state.message === "throttled"
              ? dict.suggest.throttled
              : dict.suggest.error}
        </p>
      )}

      <Field label={dict.suggest.name} htmlFor="name" required>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder={dict.suggest.namePlaceholder}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={dict.suggest.sector} htmlFor="sector">
          <Input
            id="sector"
            name="sector"
            type="text"
            placeholder={dict.suggest.sectorPlaceholder}
          />
        </Field>
        <Field label={dict.suggest.region} htmlFor="region">
          <Input
            id="region"
            name="region"
            type="text"
            placeholder={dict.suggest.regionPlaceholder}
          />
        </Field>
      </div>

      <Field label={dict.suggest.url} htmlFor="url">
        <Input
          id="url"
          name="url"
          type="url"
          placeholder={dict.suggest.urlPlaceholder}
        />
      </Field>

      <Field label={dict.suggest.email} htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={dict.suggest.emailPlaceholder}
        />
      </Field>

      <div>
        <Button type="submit" variant="primary" disabled={pending}>
          {dict.suggest.submit}
        </Button>
      </div>
    </form>
  );
}
