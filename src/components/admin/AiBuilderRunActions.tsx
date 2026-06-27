"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteRun, deleteAllRuns } from "@/app/[locale]/admin/ai-builder/actions";
import type { Locale } from "@/lib/types";

/** Per-row delete for a single AI builder run. */
export function DeleteRunButton({
  locale,
  runId,
  label,
  confirmText,
}: {
  locale: Locale;
  runId: string;
  label: string;
  confirmText: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) start(() => deleteRun(locale, runId));
      }}
      aria-label={label}
      className="shrink-0 rounded-pill border border-danger/40 px-3 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
    >
      {pending ? "…" : label}
    </button>
  );
}

/** Clear all non-accepted runs. */
export function DeleteAllRunsButton({
  locale,
  label,
  confirmText,
}: {
  locale: Locale;
  label: string;
  confirmText: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) start(() => deleteAllRuns(locale));
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}
