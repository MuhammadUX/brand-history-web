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
import {
  Card,
  Button,
  Textarea,
  Select,
  Input,
  AIReviewBlock,
} from "@/components/ui";
import type { ConfidencePillProps } from "@/components/ui";
import {
  createDraftBrand,
  createSector,
} from "@/app/[locale]/admin/ai-builder/actions";

type Decision = "accepted" | "rejected" | "pending";

// Map the provider's confidence band (H/M/L) onto the Library AIReviewBlock's
// confidence scale (high/medium/low) — the band stays the source of truth.
const BAND_TO_CONFIDENCE: Record<ConfidenceBand, ConfidencePillProps["confidence"]> = {
  H: "high",
  M: "medium",
  L: "low",
};

/** Source slot: a domain link / non-URL label, or an honest "no source" note. */
function sourceNode(
  meta: FieldMeta | undefined,
  t: Record<string, string>,
): React.ReactNode {
  if (!meta || meta.sources.length === 0) {
    return <span className="text-muted">{t.noSource}</span>;
  }
  const dom = meta.sources[0].domain;
  const isUrl = dom.includes(".");
  if (isUrl) {
    return (
      <a
        href={"https://" + dom}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-link hover:underline"
      >
        {dom}
      </a>
    );
  }
  return <span className="text-muted">{dom}</span>;
}

/**
 * Accept toggle (click again to un-accept). There is no separate "reject" — an
 * item is simply included when accepted and left out otherwise.
 */
function DecisionButtons({
  decision,
  onAccept,
  t,
}: {
  decision: Decision;
  onAccept: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant={decision === "accepted" ? "primary" : "ghost"}
        size="sm"
        onClick={onAccept}
        aria-pressed={decision === "accepted"}
      >
        {decision === "accepted" ? t.accepted : t.accept}
      </Button>
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

  // Sectors live in state so a sector created here appears in the dropdown
  // immediately (and can be auto-selected) without a full page reload.
  const [sectorList, setSectorList] = useState<Sector[]>(sectors);
  const proposed = draft.sector_new ?? null;
  // The proposed sector is still offerable only if it isn't already in the list.
  const proposedAvailable =
    !!proposed && !sectorList.some((s) => s.slug === proposed.slug);
  const [sectorBusy, setSectorBusy] = useState(false);
  const [sectorErr, setSectorErr] = useState<string | null>(null);

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

  // Operator-added items (manual completion of what the AI missed). These are
  // always included on create (accepted by default) and validated server-side.
  type AddedColor = { name: string; hex: string; role: string };
  type AddedAsset = { asset_type: string; name_en: string; name_ar: string };
  const [addedColors, setAddedColors] = useState<AddedColor[]>([]);
  const [addedAssets, setAddedAssets] = useState<AddedAsset[]>([]);

  const COLOR_ROLES = ["primary", "secondary", "neutral", "accent"] as const;
  const ASSET_TYPES = ["logo_primary", "secondary", "icon", "wordmark", "monochrome"] as const;
  const roleLabel: Record<string, string> = {
    primary: t.rolePrimary,
    secondary: t.roleSecondary,
    neutral: t.roleNeutral,
    accent: t.roleAccent,
  };

  const addColorRow = () =>
    setAddedColors((p) => [...p, { name: "", hex: "#000000", role: "primary" }]);
  const updateColorRow = (i: number, patch: Partial<AddedColor>) =>
    setAddedColors((p) => p.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeColorRow = (i: number) =>
    setAddedColors((p) => p.filter((_, idx) => idx !== i));

  const addAssetRow = () =>
    setAddedAssets((p) => [...p, { asset_type: "logo_primary", name_en: "", name_ar: "" }]);
  const updateAssetRow = (i: number, patch: Partial<AddedAsset>) =>
    setAddedAssets((p) => p.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const removeAssetRow = (i: number) =>
    setAddedAssets((p) => p.filter((_, idx) => idx !== i));

  // A valid hex is #RRGGBB; an added color also needs a name + role.
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  const validAddedColors = addedColors.filter(
    (c) => c.name.trim() && HEX_RE.test(c.hex) && COLOR_ROLES.includes(c.role as typeof COLOR_ROLES[number]),
  );
  const validAddedAssets = addedAssets.filter(
    (a) => a.asset_type.trim() && (a.name_en.trim() || a.name_ar.trim()),
  );

  const setDecision = (key: string, d: Decision) =>
    setDecisions((p) => ({ ...p, [key]: p[key] === d ? "pending" : d }));
  const decisionOf = (key: string): Decision => decisions[key] ?? "pending";
  const isAccepted = (key: string) => decisionOf(key) === "accepted";

  // Count of low/unsourced items excluded by the bulk control.
  const excludedCount = useMemo(
    () => allKeys.filter((k) => !isHighConfidenceSourced(meta[k])).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft],
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
  const acceptedColorCount = colorKeys.filter(isAccepted).length + validAddedColors.length;
  const acceptedAssetCount = assetKeys.filter(isAccepted).length + validAddedAssets.length;
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
      // Operator-added colors/assets. Server re-validates each (hex, role,
      // asset_type, length caps) before inserting.
      added: {
        colors: validAddedColors,
        assets: validAddedAssets,
      },
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

  // One-click create the AI-proposed sector, then select it.
  const createProposedSector = () => {
    if (!proposed || sectorBusy) return;
    setSectorErr(null);
    setSectorBusy(true);
    start(async () => {
      const res = await createSector(locale, {
        slug: proposed.slug,
        name_en: proposed.name_en,
        name_ar: proposed.name_ar,
      });
      setSectorBusy(false);
      if (res.ok && res.sectorId && res.slug) {
        // Add to the list if not already present, then select it.
        setSectorList((prev) =>
          prev.some((s) => s.slug === res.slug)
            ? prev
            : [
                ...prev,
                {
                  id: res.sectorId as string,
                  slug: res.slug as string,
                  name_en: proposed.name_en,
                  name_ar: proposed.name_ar,
                  sort_order: prev.length + 1,
                },
              ],
        );
        setFields((p) => ({ ...p, sector_slug: res.slug as string }));
        setDecisions((p) => ({ ...p, sector: "accepted" }));
      } else {
        setSectorErr(t.sectorCreateError);
      }
    });
  };

  // Shared per-item review props for the AIReviewBlock.
  const reviewProps = (key: string, band: ConfidenceBand | undefined, conflict = false) => ({
    confidence: BAND_TO_CONFIDENCE[band ?? "L"],
    source: sourceNode(meta[key], t),
    conflict,
    accepted: decisionOf(key) === "accepted",
    rejected: decisionOf(key) === "rejected",
    actions: (
      <DecisionButtons
        decision={decisionOf(key)}
        onAccept={() => setDecision(key, "accepted")}
        t={t}
      />
    ),
  });

  return (
    <div>
      {/* Persistent review banner */}
      <div
        role="status"
        className="mb-5 flex items-center gap-2 rounded-lg border border-amber-line bg-amber-bg px-4 py-3 text-[14px] font-medium text-amber"
      >
        <span aria-hidden>{"⚠"}</span>
        {t.reviewBanner}
      </div>

      {/* No-findings notice: the provider returned little/nothing. */}
      {draft.no_findings && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[14px] text-muted"
        >
          <span aria-hidden>{"ℹ"}</span>
          {t.noFindings}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2 font-bold tracking-tight text-ink">
          {t.reviewTitle}: <span className="text-muted">{inputName}</span>
        </h1>
        <Button type="button" variant="ghost" size="sm" onClick={acceptAllHigh}>
          {t.acceptAllHigh}
          <span className="ms-1 font-normal text-muted">
            {"(" + t.acceptAllHighNote.replace("{n}", String(excludedCount)) + ")"}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Overview */}
          <AIReviewBlock title={t.blockOverview} {...reviewProps("overview", meta.overview?.band as ConfidenceBand)}>
            <div className="space-y-3">
              {showEn && (
                <label className="block">
                  <span className="mb-1 block text-[12px] text-muted">{t.overviewEn}</span>
                  <Textarea
                    rows={2}
                    value={fields.overview_en}
                    onChange={(e) => setFields((p) => ({ ...p, overview_en: e.target.value }))}
                  />
                </label>
              )}
              {showAr && (
                <label className="block" dir="rtl">
                  <span className="mb-1 block text-[12px] text-muted">{t.overviewAr}</span>
                  <Textarea
                    rows={2}
                    value={fields.overview_ar}
                    onChange={(e) => setFields((p) => ({ ...p, overview_ar: e.target.value }))}
                  />
                </label>
              )}
            </div>
          </AIReviewBlock>

          {/* Key facts */}
          <Card>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.blockFacts}
            </h2>

            <div className="space-y-3">
              <AIReviewBlock title={t.sector} {...reviewProps("sector", meta.sector?.band as ConfidenceBand)}>
                <div className="space-y-2">
                  <Select
                    value={fields.sector_slug}
                    onChange={(e) => setFields((p) => ({ ...p, sector_slug: e.target.value }))}
                  >
                    <option value="">{"—"}</option>
                    {sectorList.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {locale === "ar" ? s.name_ar : s.name_en}
                      </option>
                    ))}
                  </Select>

                  {/* AI proposed a sector not yet in the taxonomy — offer to create it. */}
                  {proposedAvailable && proposed && (
                    <div className="rounded-md border border-line bg-surface-2 px-3 py-2">
                      <p className="text-[12px] text-muted">
                        {t.sectorSuggested}{" "}
                        <span className="font-medium text-ink">
                          {locale === "ar" ? proposed.name_ar : proposed.name_en}
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1.5"
                        onClick={createProposedSector}
                        disabled={sectorBusy || pending}
                      >
                        {sectorBusy
                          ? t.sectorCreating
                          : t.sectorCreateNew.replace(
                              "{name}",
                              locale === "ar" ? proposed.name_ar : proposed.name_en,
                            )}
                      </Button>
                      {sectorErr && (
                        <p className="mt-1 text-[12px] text-danger">{sectorErr}</p>
                      )}
                    </div>
                  )}
                </div>
              </AIReviewBlock>

              <AIReviewBlock
                title={t.foundedYear}
                {...reviewProps(
                  "founded_year",
                  meta.founded_year?.band as ConfidenceBand,
                  Boolean(meta.founded_year?.conflict),
                )}
              >
                <Input
                  type="number"
                  className="w-32"
                  value={fields.founded_year}
                  onChange={(e) => setFields((p) => ({ ...p, founded_year: e.target.value }))}
                />
              </AIReviewBlock>
            </div>
          </Card>

          {/* Colors */}
          <Card>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.blockColors}
            </h2>
            <div className="space-y-3">
              {draft.colors.length === 0 && addedColors.length === 0 && (
                <p className="text-[13px] text-muted">{t.colorsEmpty}</p>
              )}
              {draft.colors.map((c, i) => {
                const key = "color:" + i;
                return (
                  <AIReviewBlock key={key} title={c.name} {...reviewProps(key, meta[key]?.band as ConfidenceBand)}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded border border-line"
                        style={{ backgroundColor: c.hex }}
                        aria-hidden
                      />
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="text-[12px] text-muted">{c.hex}</span>
                      {c.role && (
                        <span className="text-[12px] text-muted">· {roleLabel[c.role] ?? c.role}</span>
                      )}
                    </div>
                  </AIReviewBlock>
                );
              })}

              {/* Operator-added color rows (accepted by default on create). */}
              {addedColors.map((c, i) => (
                <div
                  key={"added-color-" + i}
                  className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-surface-2 px-3 py-2"
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded border border-line"
                    style={{ backgroundColor: HEX_RE.test(c.hex) ? c.hex : "transparent" }}
                    aria-hidden
                  />
                  <label className="block flex-1 min-w-[120px]">
                    <span className="mb-1 block text-[12px] text-muted">{t.colorName}</span>
                    <Input
                      value={c.name}
                      onChange={(e) => updateColorRow(i, { name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] text-muted">{t.colorHex}</span>
                    <Input
                      type="color"
                      className="h-9 w-14 p-1"
                      value={HEX_RE.test(c.hex) ? c.hex : "#000000"}
                      onChange={(e) => updateColorRow(i, { hex: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] text-muted">{t.colorRole}</span>
                    <Select
                      value={c.role}
                      onChange={(e) => updateColorRow(i, { role: e.target.value })}
                    >
                      {COLOR_ROLES.map((r) => (
                        <option key={r} value={r}>{roleLabel[r]}</option>
                      ))}
                    </Select>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColorRow(i)}
                  >
                    {t.removeRow}
                  </Button>
                </div>
              ))}

              <Button type="button" variant="ghost" size="sm" onClick={addColorRow}>
                {"+ " + t.addColor}
              </Button>
            </div>
          </Card>

          {/* Assets */}
          <Card>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.blockAssets}
            </h2>
            <div className="space-y-3">
              {draft.assets.length === 0 && addedAssets.length === 0 && (
                <p className="text-[13px] text-muted">{t.assetsEmpty}</p>
              )}
              {draft.assets.map((a, i) => {
                const key = "asset:" + i;
                return (
                  <AIReviewBlock key={key} title={a.name_en} {...reviewProps(key, meta[key]?.band as ConfidenceBand)}>
                    <div className="text-[14px]">
                      <span className="font-medium text-ink">{a.name_en}</span>
                      <span className="ms-2 text-[12px] text-muted">{a.asset_type}</span>
                    </div>
                  </AIReviewBlock>
                );
              })}

              {/* Operator-added asset rows (included on create). */}
              {addedAssets.map((a, i) => (
                <div
                  key={"added-asset-" + i}
                  className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-surface-2 px-3 py-2"
                >
                  <label className="block">
                    <span className="mb-1 block text-[12px] text-muted">{t.assetType}</span>
                    <Select
                      value={a.asset_type}
                      onChange={(e) => updateAssetRow(i, { asset_type: e.target.value })}
                    >
                      {ASSET_TYPES.map((ty) => (
                        <option key={ty} value={ty}>{ty}</option>
                      ))}
                    </Select>
                  </label>
                  {showEn && (
                    <label className="block flex-1 min-w-[120px]">
                      <span className="mb-1 block text-[12px] text-muted">{t.assetNameEn}</span>
                      <Input
                        value={a.name_en}
                        onChange={(e) => updateAssetRow(i, { name_en: e.target.value })}
                      />
                    </label>
                  )}
                  {showAr && (
                    <label className="block flex-1 min-w-[120px]" dir="rtl">
                      <span className="mb-1 block text-[12px] text-muted">{t.assetNameAr}</span>
                      <Input
                        value={a.name_ar}
                        onChange={(e) => updateAssetRow(i, { name_ar: e.target.value })}
                      />
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAssetRow(i)}
                  >
                    {t.removeRow}
                  </Button>
                </div>
              ))}

              <Button type="button" variant="ghost" size="sm" onClick={addAssetRow}>
                {"+ " + t.addAsset}
              </Button>
              <p className="text-[12px] text-muted">{t.assetUploadNote}</p>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.blockTimeline}
            </h2>
            <div className="space-y-3">
              {draft.timeline.map((tl, i) => {
                const key = "timeline:" + i;
                return (
                  <AIReviewBlock key={key} title={String(tl.year)} {...reviewProps(key, meta[key]?.band as ConfidenceBand)}>
                    <div className="text-[14px]">
                      <span className="font-semibold text-ink">{tl.year}</span>
                      <span className="ms-2 text-ink">{tl.title_en}</span>
                    </div>
                  </AIReviewBlock>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right rail: validation checklist */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-label text-muted">
              {t.checklistTitle}
            </h2>
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-[14px]">
                  <span
                    aria-hidden
                    className={
                      "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] " +
                      (c.ok
                        ? "bg-[#eef9f1] text-ok"
                        : "border border-line bg-surface-2 text-muted")
                    }
                  >
                    {c.ok ? "✓" : ""}
                  </span>
                  <span className={c.ok ? "text-ink" : "text-muted"}>{t[c.key]}</span>
                </li>
              ))}
            </ul>

            {validation.length > 0 && (
              <p className="mt-3 rounded-md border border-danger/30 bg-[#fdeced] px-2.5 py-2 text-[12px] text-danger">
                {t.validationFailed}
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-md border border-danger/30 bg-[#fdeced] px-2.5 py-2 text-[12px] text-danger">
                {error}
              </p>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={submit}
              disabled={pending || !allOk}
              className="mt-4 w-full"
            >
              {pending ? t.creating : t.createDraft}
            </Button>
            <p className="mt-2 text-[12px] text-muted">{t.calmNote}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
