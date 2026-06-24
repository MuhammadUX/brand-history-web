"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Sector } from "@/lib/types";
import { getDictionary } from "@/i18n";
import {
  isHighConfidenceSourced,
  type BrandDraft,
  type ConfidenceBand,
  type FieldMeta,
} from "@/lib/ai/llm-provider";
import { createDraftBrand } from "@/app/[locale]/admin/ai-builder/actions";

type Decision = "accepted" | "rejected" | "pending";

const inputCls =
  "w-full rounded-btn border border-border bg-page px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Confidence indicator: text + shape + colour (never colour alone). */
function ConfBadge({ band, t }: { band: ConfidenceBand; t: Record<string, string> }) {
  const map: Record<ConfidenceBand, { label: string; shape: string; cls: string }> = {
    H: { label: t.confHigh, shape: "▲", cls: "bg-green-50 text-green-700 border-green-300" },
    M: { label: t.confMed, shape: "■", cls: "bg-amber-50 text-amber-700 border-amber-300" },
    L: { label: t.confLow, shape: "●", cls: "bg-red-50 text-red-700 border-red-300" },
  };
  const c = map[band];
  return (
    <span
      className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium " + c.cls}
      title={c.label}
    >
      <span aria-hidden>{c.shape}</span>
      {c.label}
    </span>
  );
}

function SourceChip({ meta, t }: { meta: FieldMeta | undefined; t: Record<string, string> }) {
  if (!meta || meta.sources.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-page px-2 py-0.5 text-xs text-tertiary">
        {t.noSource}
      </span>
    );
  }
  const dom = meta.sources[0].domain;
  const isUrl = dom.includes(".");
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-tertiary">{t.source}:</span>
      {isUrl ? (
        <a
          href={"https://" + dom}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border bg-page px-2 py-0.5 font-medium text-primary hover:underline"
        >
          {dom}
        </a>
      ) : (
        <span className="rounded-full border border-border bg-page px-2 py-0.5 text-secondary">{dom}</span>
      )}
    </span>
  );
}

function DecisionButtons({
  decision,
  onAccept,
  onReject,
  t,
}: {
  decision: Decision;
  onAccept: () => void;
  onReject: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onAccept}
        aria-pressed={decision === "accepted"}
        className={
          "rounded-btn border px-2.5 py-1 text-xs font-medium transition " +
          (decision === "accepted"
            ? "border-green-400 bg-green-50 text-green-700"
            : "border-border text-ink hover:bg-page")
        }
      >
        {decision === "accepted" ? t.accepted : t.accept}
      </button>
      <button
        type="button"
        onClick={onReject}
        aria-pressed={decision === "rejected"}
        className={
          "rounded-btn border px-2.5 py-1 text-xs font-medium transition " +
          (decision === "rejected"
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-border text-ink hover:bg-page")
        }
      >
        {decision === "rejected" ? t.rejected : t.reject}
      </button>
    </div>
  );
}

export default function DraftReview({
  locale,
  runId,
  inputName,
  draft,
  sectors,
  languages,
}: {
  locale: Locale;
  runId: string;
  inputName: string;
  draft: BrandDraft;
  sectors: Sector[];
  languages: string[];
}) {
  const t = getDictionary(locale).admin.aiBuilder as unknown as Record<string, string>;
  const router = useRouter();
  const [pending, start] = useTransition();
  const meta = draft.fields_meta || {};

  const showEn = languages.includes("en");
  const showAr = languages.includes("ar");

  // Build the list of all gateable item keys.
  const colorKeys = draft.colors.map((_, i) => "color:" + i);
  const assetKeys = draft.assets.map((_, i) => "asset:" + i);
  const timelineKeys = draft.timeline.map((_, i) => "timeline:" + i);
  const scalarKeys = ["overview", "summary", "sector", "founded_year"];
  const allKeys = [...scalarKeys, ...colorKeys, ...assetKeys, ...timelineKeys];

  // Decisions + inline edits.
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [fields, setFields] = useState<Record<string, string>>({
    overview_en: draft.overview_en,
    overview_ar: draft.overview_ar,
    summary_en: draft.summary_en,
    summary_ar: draft.summary_ar,
    sector_slug: draft.sector_slug ?? "",
    founded_year: draft.founded_year ? String(draft.founded_year) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string[]>([]);

  const setDecision = (key: string, d: Decision) =>
    setDecisions((p) => ({ ...p, [key]: p[key] === d ? "pending" : d }));
  const decisionOf = (key: string): Decision => decisions[key] ?? "pending";
  const isAccepted = (key: string) => decisionOf(key) === "accepted";

  // Count of low/unsourced items excluded by the bulk control.
  const excludedCount = useMemo(
    () => allKeys.filter((k) => !isHighConfidenceSourced(meta[k])).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft]
  );

  // Bulk: accept all H+sourced; leave the rest for individual review.
  const acceptAllHigh = () => {
    setDecisions((prev) => {
      const next = { ...prev };
      allKeys.forEach((k) => {
        if (isHighConfidenceSourced(meta[k])) next[k] = "accepted";
      });
      return next;
    });
  };

  // Live right-rail checklist (mirror of server validation).
  const acceptedColorCount = colorKeys.filter(isAccepted).length;
  const acceptedAssetCount = assetKeys.filter(isAccepted).length;
  const overviewOk =
    (isAccepted("overview") &&
      (!showEn || fields.overview_en.trim()) &&
      (!showAr || fields.overview_ar.trim())) ||
    (isAccepted("summary") &&
      (!showEn || fields.summary_en.trim()) &&
      (!showAr || fields.summary_ar.trim()));

  const checklist = [
    { key: "vName", ok: !!inputName.trim() },
    { key: "vColor", ok: acceptedColorCount >= 1 },
    { key: "vAsset", ok: acceptedAssetCount >= 1 },
    { key: "vOverview", ok: !!overviewOk },
  ];
  const allOk = checklist.every((c) => c.ok);

  const submit = () => {
    setError(null);
    setValidation([]);
    const accept: Record<string, boolean> = {};
    allKeys.forEach((k) => {
      const d = decisionOf(k);
      if (d !== "pending") accept[k] = d === "accepted";
    });
    const payload = {
      fields,
      accept,
      bulkHigh: false, // bulk choices are already materialised into `accept`
    };
    const fd = new FormData();
    fd.set("decisions", JSON.stringify(payload));

    start(async () => {
      const res = await createDraftBrand(locale, runId, fd);
      if (res.ok && res.brandId) {
        router.push(`/${locale}/admin/brands/${res.brandId}`);
        return;
      }
      if (res.message === "validation") setValidation(res.validation ?? []);
      else setError(t.createError);
    });
  };

  const cardCls = "rounded-card border border-border bg-surface p-5";
  const blockHeadCls = "mb-3 flex items-center justify-between gap-2";

  return (
    <div>
      {/* Persistent banner */}
      <div
        role="status"
        className="mb-5 flex items-center gap-2 rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
      >
        <span aria-hidden>{"⚠"}</span>
        {t.reviewBanner}
      </div>

      {/* No-findings notice: the provider returned little/nothing. */}
      {draft.no_findings && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-card border border-border bg-page px-4 py-3 text-sm text-secondary"
        >
          <span aria-hidden>{"ℹ"}</span>
          {t.noFindings}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {t.reviewTitle}: <span className="text-secondary">{inputName}</span>
        </h1>
        <button
          type="button"
          onClick={acceptAllHigh}
          className="rounded-btn border border-primary/40 bg-primary-tint/40 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary-tint"
        >
          {t.acceptAllHigh}
          <span className="ms-1 font-normal text-secondary">
            {"(" + t.acceptAllHighNote.replace("{n}", String(excludedCount)) + ")"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Overview */}
          <section className={cardCls}>
            <div className={blockHeadCls}>
              <h2 className="text-sm font-semibold text-ink">{t.blockOverview}</h2>
              <div className="flex items-center gap-2">
                <ConfBadge band={(meta.overview?.band ?? "L") as ConfidenceBand} t={t} />
                <SourceChip meta={meta.overview} t={t} />
                <DecisionButtons
                  decision={decisionOf("overview")}
                  onAccept={() => setDecision("overview", "accepted")}
                  onReject={() => setDecision("overview", "rejected")}
                  t={t}
                />
              </div>
            </div>
            {showEn && (
              <label className="mb-2 block">
                <span className="mb-1 block text-xs text-secondary">{t.overviewEn}</span>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.overview_en}
                  onChange={(e) => setFields((p) => ({ ...p, overview_en: e.target.value }))}
                />
              </label>
            )}
            {showAr && (
              <label className="block" dir="rtl">
                <span className="mb-1 block text-xs text-secondary">{t.overviewAr}</span>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.overview_ar}
                  onChange={(e) => setFields((p) => ({ ...p, overview_ar: e.target.value }))}
                />
              </label>
            )}
          </section>

          {/* Key facts */}
          <section className={cardCls}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{t.blockFacts}</h2>

            <div className="mb-4 border-b border-border pb-4">
              <div className={blockHeadCls}>
                <span className="text-xs font-medium text-secondary">{t.sector}</span>
                <div className="flex items-center gap-2">
                  <ConfBadge band={(meta.sector?.band ?? "L") as ConfidenceBand} t={t} />
                  <SourceChip meta={meta.sector} t={t} />
                  <DecisionButtons
                    decision={decisionOf("sector")}
                    onAccept={() => setDecision("sector", "accepted")}
                    onReject={() => setDecision("sector", "rejected")}
                    t={t}
                  />
                </div>
              </div>
              <select
                className={inputCls}
                value={fields.sector_slug}
                onChange={(e) => setFields((p) => ({ ...p, sector_slug: e.target.value }))}
              >
                <option value="">{"—"}</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {locale === "ar" ? s.name_ar : s.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={blockHeadCls}>
                <span className="text-xs font-medium text-secondary">{t.foundedYear}</span>
                <div className="flex items-center gap-2">
                  {meta.founded_year?.conflict && (
                    <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                      {t.conflictFlag}
                    </span>
                  )}
                  <ConfBadge band={(meta.founded_year?.band ?? "L") as ConfidenceBand} t={t} />
                  <SourceChip meta={meta.founded_year} t={t} />
                  <DecisionButtons
                    decision={decisionOf("founded_year")}
                    onAccept={() => setDecision("founded_year", "accepted")}
                    onReject={() => setDecision("founded_year", "rejected")}
                    t={t}
                  />
                </div>
              </div>
              <input
                type="number"
                className={inputCls + " w-32"}
                value={fields.founded_year}
                onChange={(e) => setFields((p) => ({ ...p, founded_year: e.target.value }))}
              />
            </div>
          </section>

          {/* Colors */}
          <section className={cardCls}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{t.blockColors}</h2>
            <div className="space-y-2">
              {draft.colors.map((c, i) => {
                const key = "color:" + i;
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded border border-border" style={{ backgroundColor: c.hex }} aria-hidden />
                      <span className="text-sm font-medium text-ink">{c.name}</span>
                      <span className="text-xs text-tertiary">{c.hex}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfBadge band={(meta[key]?.band ?? "L") as ConfidenceBand} t={t} />
                      <SourceChip meta={meta[key]} t={t} />
                      <DecisionButtons
                        decision={decisionOf(key)}
                        onAccept={() => setDecision(key, "accepted")}
                        onReject={() => setDecision(key, "rejected")}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Assets */}
          <section className={cardCls}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{t.blockAssets}</h2>
            <div className="space-y-2">
              {draft.assets.map((a, i) => {
                const key = "asset:" + i;
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border px-2.5 py-2">
                    <div className="text-sm">
                      <span className="font-medium text-ink">{a.name_en}</span>
                      <span className="ms-2 text-xs text-tertiary">{a.asset_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfBadge band={(meta[key]?.band ?? "L") as ConfidenceBand} t={t} />
                      <SourceChip meta={meta[key]} t={t} />
                      <DecisionButtons
                        decision={decisionOf(key)}
                        onAccept={() => setDecision(key, "accepted")}
                        onReject={() => setDecision(key, "rejected")}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section className={cardCls}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{t.blockTimeline}</h2>
            <div className="space-y-2">
              {draft.timeline.map((tl, i) => {
                const key = "timeline:" + i;
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-btn border border-border px-2.5 py-2">
                    <div className="text-sm">
                      <span className="font-semibold text-ink">{tl.year}</span>
                      <span className="ms-2 text-ink">{tl.title_en}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfBadge band={(meta[key]?.band ?? "L") as ConfidenceBand} t={t} />
                      <SourceChip meta={meta[key]} t={t} />
                      <DecisionButtons
                        decision={decisionOf(key)}
                        onAccept={() => setDecision(key, "accepted")}
                        onReject={() => setDecision(key, "rejected")}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right rail: validation checklist */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className={cardCls}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{t.checklistTitle}</h2>
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={
                      "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] " +
                      (c.ok ? "bg-green-100 text-green-700" : "bg-page text-tertiary border border-border")
                    }
                  >
                    {c.ok ? "✓" : ""}
                  </span>
                  <span className={c.ok ? "text-ink" : "text-secondary"}>{t[c.key]}</span>
                </li>
              ))}
            </ul>

            {validation.length > 0 && (
              <p className="mt-3 rounded-btn border border-red-300 bg-red-50 px-2.5 py-2 text-xs text-red-700">
                {t.validationFailed}
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-btn border border-red-300 bg-red-50 px-2.5 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending || !allOk}
              className="mt-4 w-full rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            >
              {pending ? t.creating : t.createDraft}
            </button>
            <p className="mt-2 text-xs text-tertiary">{t.calmNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
