"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Card, Button } from "@/components/ui";
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
    <div className="mx-auto max-w-lg" role="status" aria-live="polite">
      <h1 className="text-h2 font-bold text-ink">{t.gatheringTitle}</h1>
      <p className="mt-1 text-[14px] text-muted">{t.gatheringNote}</p>

      <Card className="mt-6">
        <ul className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-[14px] text-ink">
              <span
                aria-hidden
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-link"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-link" />
              </span>
              {s}
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-[12px] text-muted">{t.lowFindings}</p>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => start(() => cancelRun(locale, runId))}
        className="mt-4"
      >
        {t.cancel}
      </Button>
    </div>
  );
}
