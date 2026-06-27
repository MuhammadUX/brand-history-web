"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Card, Button } from "@/components/ui";
import { cancelRun } from "@/app/[locale]/admin/ai-builder/actions";

/**
 * Step 2 interstitial. A real grounded provider call takes 30–90s, so the run
 * stays in 'gathering' while the background worker runs. We poll by refreshing
 * the server component every few seconds until the status flips to
 * draft_ready/failed (the page re-renders the right branch when it does).
 *
 * After ~3 minutes we surface a "taking longer than expected" notice with a
 * Cancel-and-retry affordance — without hard-failing the row.
 */
const POLL_MS = 3000;
const STALE_MS = 3 * 60 * 1000; // 3 minutes

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
  const [stale, setStale] = useState(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    const poll = setInterval(() => {
      router.refresh();
      if (Date.now() - startedAt.current >= STALE_MS) {
        setStale(true);
      }
    }, POLL_MS);
    return () => clearInterval(poll);
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

      {stale && (
        <p className="mt-4 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.gatheringStale}
        </p>
      )}

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
