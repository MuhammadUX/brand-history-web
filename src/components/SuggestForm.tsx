"use client";

import { useActionState } from "react";
import { submitSuggestion, type SuggestState } from "@/app/[locale]/suggest/actions";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Field, Input, Button, Card } from "@/components/ui";

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
      <Card className="p-8 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill border border-ok/40 bg-ok/10 text-[20px] text-ok"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-ink">
          {dict.suggest.successTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-5 text-muted">
          {dict.suggest.successBody}
        </p>
        <Button href={`/${locale}/suggest`} variant="ghost" className="mt-6">
          {dict.suggest.addAnother}
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        {state.status === "error" && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 px-4 py-2.5 text-[13px] text-danger"
          >
            <span aria-hidden="true">⚠</span>
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
    </Card>
  );
}
