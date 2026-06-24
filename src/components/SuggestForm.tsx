"use client";

import { useActionState } from "react";
import { submitSuggestion, type SuggestState } from "@/app/[locale]/suggest/actions";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";

interface SuggestFormProps {
  locale: Locale;
}

const initialState: SuggestState = { status: "idle" };

export default function SuggestForm({ locale }: SuggestFormProps) {
  const dict = getDictionary(locale);
  const action = submitSuggestion.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, initialState);

  const fieldCls =
    "w-full rounded-btn border border-border bg-page px-4 py-2.5 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const labelCls = "block text-sm font-medium text-ink";

  if (state.status === "success") {
    return (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-verifiedBg text-verifiedText"
          aria-hidden="true"
        >
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ink">
          {dict.suggest.successTitle}
        </h2>
        <p className="mt-2 text-sm text-secondary">{dict.suggest.successBody}</p>
        <a
          href={`/${locale}/suggest`}
          className="mt-6 inline-flex rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {dict.suggest.addAnother}
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-card border border-border bg-surface p-6 sm:p-8"
    >
      {state.status === "error" && (
        <p className="rounded-btn bg-sponsoredBg px-4 py-2.5 text-sm font-medium text-sponsored">
          {state.message === "required" ? dict.suggest.required : dict.suggest.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className={labelCls}>
          {dict.suggest.name} *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder={dict.suggest.namePlaceholder}
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="sector" className={labelCls}>
            {dict.suggest.sector}
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            placeholder={dict.suggest.sectorPlaceholder}
            className={fieldCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="region" className={labelCls}>
            {dict.suggest.region}
          </label>
          <input
            id="region"
            name="region"
            type="text"
            placeholder={dict.suggest.regionPlaceholder}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="url" className={labelCls}>
          {dict.suggest.url}
        </label>
        <input
          id="url"
          name="url"
          type="url"
          placeholder={dict.suggest.urlPlaceholder}
          className={fieldCls}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className={labelCls}>
          {dict.suggest.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder={dict.suggest.emailPlaceholder}
          className={fieldCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-btn bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {dict.suggest.submit}
      </button>
    </form>
  );
}
