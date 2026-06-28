"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Sector } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { createClient } from "@/lib/supabase-browser";
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

// Operator-added assets upload to the same public Storage bucket as the editor.
const ASSET_BUCKET = "brand-assets";
const ASSET_ACCEPT = "image/svg+xml,image/png,image/jpeg,image/webp";

// A valid hex is #RRGGBB (uppercase fine). Operators may type without the '#'.
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Best-effort file extension from a filename, lowercased, no dot. */
function extFromName(name: string): string | null {
  const clean = name.split(/[?#]/)[0];
  const m = clean.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Normalize an operator-typed hex toward #RRGGBB: trim, add a leading '#' if
 * missing, uppercase. Returns the (possibly still-invalid) candidate — callers
 * validate with HEX_RE. Empty stays empty so the field can be cleared.
 */
function normalizeHex(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  if (!v.startsWith("#")) v = "#" + v;
  return v.toUpperCase();
}

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
  type AddedAsset = {
    asset_type: string;
    name_en: string;
    name_ar: string;
    // Optional uploaded image: a public URL + detected extension. Upload is
    // optional, so an asset can be added without a file.
    image_url?: string;
    ext?: string;
    uploading?: boolean;
    uploadError?: boolean;
  };
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

  /**
   * Upload an operator-chosen file for an added-asset row to the public
   * `brand-assets` bucket. The draft has no brand id yet, so the path is
   * scoped to the run: `ai-drafts/<runId>/<uuid>.<ext>`. On success the row
   * keeps the public URL + detected extension; both flow into the create
   * payload's `decisions.added.assets[]`.
   */
  async function uploadAssetFile(i: number, file: File) {
    updateAssetRow(i, { uploading: true, uploadError: false });
    try {
      const supabase = createClient();
      const ext = extFromName(file.name) || "png";
      const uuid = crypto?.randomUUID?.() ?? String(Date.now());
      const path = `ai-drafts/${runId}/${uuid}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(ASSET_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) {
        updateAssetRow(i, { uploading: false, uploadError: true });
        return;
      }
      const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      updateAssetRow(i, {
        image_url: publicUrl,
        ext,
        uploading: false,
        uploadError: false,
      });
    } catch {
      updateAssetRow(i, { uploading: false, uploadError: true });
    }
  }

  // An added color needs a name + valid #RRGGBB hex + role.
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
        // Strip transient UI flags (uploading/uploadError); send only the
        // persisted shape incl. the optional uploaded image_url + extension.
        assets: validAddedAssets.map((a) => ({
          asset_type: a.asset_type,
          name_en: a.name_en,
          name_ar: a.name_ar,
          ...(a.image_url ? { image_url: a.image_url } : {}),
          ...(a.ext ? { ext: a.ext } : {}),
        })),
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
                    <div className="flex items-center gap-1.5">
                      {/* Primary entry: type the hex (#RRGGBB). Normalized on
                          change so a leading '#' is added and case folded. */}
                      <Input
                        value={c.hex}
                        placeholder={t.colorHexHint}
                        aria-invalid={c.hex.trim() !== "" && !HEX_RE.test(c.hex)}
                        className="w-28 font-mono"
                        onChange={(e) =>
                          updateColorRow(i, { hex: normalizeHex(e.target.value) })
                        }
                      />
                      {/* Synced swatch picker: picking updates the text field. */}
                      <Input
                        type="color"
                        aria-label={t.colorHex}
                        className="h-9 w-10 shrink-0 p-1"
                        value={HEX_RE.test(c.hex) ? c.hex : "#000000"}
                        onChange={(e) =>
                          updateColorRow(i, { hex: normalizeHex(e.target.value) })
                        }
                      />
                    </div>
                    {c.hex.trim() !== "" && !HEX_RE.test(c.hex) && (
                      <span className="mt-1 block text-[11px] text-danger">
                        {t.colorHexInvalid}
                      </span>
                    )}
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
                  {/* Optional image upload (svg/png/jpg/webp) → brand-assets
                      bucket; resulting public URL rides into the create payload. */}
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface"
                      aria-hidden={a.image_url ? undefined : "true"}
                    >
                      {a.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.image_url}
                          alt={t.assetImagePreview}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-muted">{t.assetImage}</span>
                      )}
                    </span>
                    <label className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-link">
                      {a.uploading ? t.assetUploading : t.assetUpload}
                      <input
                        type="file"
                        accept={ASSET_ACCEPT}
                        className="hidden"
                        disabled={a.uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadAssetFile(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {a.image_url && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAssetRow(i, { image_url: undefined, ext: undefined })
                        }
                        className="rounded-md px-2 py-1.5 text-[12px] font-medium text-muted hover:text-danger"
                      >
                        {t.assetClearImage}
                      </button>
                    )}
                    {a.uploadError && (
                      <span className="text-[12px] text-danger">{t.assetUploadError}</span>
                    )}
                  </div>
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
