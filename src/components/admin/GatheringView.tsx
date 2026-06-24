"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { cancelRun } from "@/app/[locale]/admin/ai-builder/actions";

/**
 * Step 2 interstitial. The stub provider is synchronous, so a 'gathering' run
 * normally flips to 'draft_ready' before this even renders. We still show a
 * calm progress state and auto-refresh; Cancel discards the run.
 */
export default function GatheringView({
  locale,
  runId,
}: {
  locale: Locale;
  runId: string;
}) {
  const t = getDictionary(locale).admin.aiBuilder;
  const router = useRouter();
  const [pending, start] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => router.refresh(), 1200);
    return () => clearTimeout(id);
  }, [router]);

  const steps = [
    t.collectOverview,
    t.collectFacts,
    t.collectColors,
    t.collectAssets,
    t.collectTimeline,
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-ink">{t.gatheringTitle}</h1>
      <p className="mt-1 text-sm text-secondary">{t.gatheringNote}</p>

      <ul className="mt-6 space-y-2 rounded-card border border-border bg-surface p-5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-ink">
            <span
              aria-hidden
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 text-xs text-primary"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            </span>
            {s}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-tertiary">{t.lowFindings}</p>

      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => cancelRun(locale, runId))}
        className="mt-4 rounded-btn border border-border px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-page disabled:opacity-60"
      >
        {t.cancel}
      </button>
    </div>
  );
}
