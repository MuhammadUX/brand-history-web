"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Locale,
  BrandColor,
  BrandAsset,
  TimelineEntry,
  BrandFont,
  BrandGuideline,
  BrandApplication,
} from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Card, Button } from "@/components/ui";
import { logoSrc } from "@/components/ui/BrandMark";
import { createClient } from "@/lib/supabase-browser";
import {
  saveColor,
  deleteColor,
  saveAsset,
  deleteAsset,
  saveTimeline,
  deleteTimeline,
  saveFont,
  deleteFont,
  saveGuideline,
  deleteGuideline,
  saveApplication,
  deleteApplication,
} from "@/app/[locale]/admin/brands/actions";

// Compact Library control surface for the dense child-row editors (smaller than
// the 44px Field/Input so a colour + name + role row fits one line).
const inputCls =
  "w-full rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[14px] text-ink placeholder:text-muted transition-colors duration-150 focus:border-link focus:outline-none focus-visible:outline-none";
const cardTitleCls =
  "mb-4 text-[13px] font-bold uppercase tracking-label text-muted";

type ChildResult = { ok: boolean; message?: string };

type EditorDict = ReturnType<typeof getDictionary>["admin"]["editor"];

/**
 * Build the error-message map for a child manager. The archived-brand message
 * (CMS-4) is role-aware: admins get the variant that points at Restore; editors
 * are told to ask an admin.
 */
function childMessages(
  t: EditorDict,
  role: "editor" | "admin"
): Record<string, string> {
  return {
    childPublished: t.childPublished,
    archivedFrozen: role === "admin" ? t.archivedFrozenAdmin : t.archivedFrozen,
    saveError: t.saveError,
    forbidden: t.forbidden,
    conflict: t.conflict,
  };
}

function useRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ChildResult>, messages: Record<string, string>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res && res.ok === false) {
        setError(messages[res.message ?? "saveError"] ?? messages.saveError);
        return;
      }
      router.refresh();
    });
  return { pending, run, error };
}

function ChildError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      className="mb-3 rounded-md border border-danger/30 bg-[#fdeced] px-2.5 py-2 text-[12px] text-danger"
      role="alert"
    >
      {error}
    </p>
  );
}

/* ---------------- Colors ---------------- */
export function ColorsManager({
  locale,
  brandId,
  colors,
  role,
}: {
  locale: Locale;
  brandId: string;
  colors: BrandColor[];
  role: "editor" | "admin";
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.colorsTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-2">
        {colors.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {colors.map((c) => (
          <form
            key={c.id}
            action={(fd) => run(() => saveColor(brandId, c.id, fd), msgs)}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="color" name="hex" defaultValue={c.hex} className="h-9 w-10 rounded-md border border-line" aria-label={t.colorHex} />
            <input name="name" defaultValue={c.name} placeholder={t.colorName} className={`${inputCls} w-32`} />
            <input name="role" defaultValue={c.role} placeholder={t.colorRole} className={`${inputCls} w-28`} />
            <input name="sort_order" type="number" defaultValue={c.sort_order} className={`${inputCls} w-16`} aria-label={t.sort} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
            <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteColor(brandId, c.id), msgs)}>{t.remove}</Button>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveColor(brandId, null, fd), msgs)} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
        <input type="color" name="hex" defaultValue="#3B5BDB" className="h-9 w-10 rounded-md border border-line" aria-label={t.colorHex} />
        <input name="name" placeholder={t.colorName} className={`${inputCls} w-32`} />
        <input name="role" defaultValue="primary" placeholder={t.colorRole} className={`${inputCls} w-28`} />
        <input name="sort_order" type="number" defaultValue={0} className={`${inputCls} w-16`} aria-label={t.sort} />
        <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
      </form>
    </Card>
  );
}

/* ---------------- Assets ---------------- */
const ASSET_TYPES = ["logo_primary", "secondary", "icon", "wordmark", "monochrome"];
const POLICIES = ["host", "link_out", "pro"];
const ASSET_BUCKET = "brand-assets";
const ASSET_ACCEPT = "image/svg+xml,image/png,image/jpeg,image/webp";

/** Reduce a brand website to a bare domain for the logo API (drops scheme/path). */
function websiteDomain(website?: string | null): string | null {
  if (!website) return null;
  const raw = website.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** Best-effort file extension from a filename or URL, lowercased, no dot. */
function extFromName(name: string): string | null {
  const clean = name.split(/[?#]/)[0];
  const m = clean.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : null;
}

type AssetImageFieldDict = Pick<
  EditorDict,
  | "assetImage"
  | "assetUpload"
  | "assetUploading"
  | "assetUploadError"
  | "assetSuggestLogo"
  | "assetImagePreview"
  | "assetClearImage"
>;

/**
 * Per-asset image control: a thumbnail preview, a file upload (to the public
 * `brand-assets` bucket via the browser/operator session so Storage RLS
 * applies), and an optional "Suggest logo" button that pre-fills the URL from
 * the brand domain via the logo API. The resolved URL lives in component state
 * and is submitted with the parent form through a hidden `image_url` input, so
 * the existing hardened `saveAsset` action persists it. Never auto-saves — the
 * operator still submits the row.
 */
function AssetImageField({
  brandId,
  assetId,
  initial,
  domain,
  t,
  onExtDetected,
}: {
  brandId: string;
  assetId: string | null;
  initial: string | null;
  domain: string | null;
  t: AssetImageFieldDict;
  onExtDetected?: (ext: string) => void;
}) {
  const [url, setUrl] = useState<string>(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = extFromName(file.name) || "png";
      // Stable, brand-scoped path. New rows (no id yet) get a uuid so two
      // unsaved rows can't collide; saved rows reuse the asset id.
      const key = assetId ?? (crypto?.randomUUID?.() ?? `${Date.now()}`);
      const path = `brands/${brandId}/${key}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(ASSET_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) {
        setErr(t.assetUploadError);
        return;
      }
      const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);
      // Cache-bust so re-uploads to the same path refresh the preview.
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      setUrl(publicUrl);
      onExtDetected?.(ext);
    } catch {
      setErr(t.assetUploadError);
    } finally {
      setBusy(false);
    }
  }

  function suggest() {
    if (!domain) return;
    setUrl(logoSrc(domain, 256));
    onExtDetected?.("png");
  }

  return (
    <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-4">
      {/* Submitted with the parent form; saveAsset reads `image_url`. */}
      <input type="hidden" name="image_url" value={url} />
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2"
        aria-hidden={url ? undefined : "true"}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={t.assetImagePreview}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[10px] text-muted">{t.assetImage}</span>
        )}
      </span>
      <label className="cursor-pointer rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-link">
        {busy ? t.assetUploading : t.assetUpload}
        <input
          type="file"
          accept={ASSET_ACCEPT}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {domain && (
        <button
          type="button"
          onClick={suggest}
          disabled={busy}
          className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-link disabled:opacity-50"
        >
          {t.assetSuggestLogo}
        </button>
      )}
      {url && (
        <button
          type="button"
          onClick={() => setUrl("")}
          className="rounded-md px-2 py-1.5 text-[12px] font-medium text-muted hover:text-danger"
        >
          {t.assetClearImage}
        </button>
      )}
      {err && <span className="text-[12px] text-danger">{err}</span>}
    </div>
  );
}

export function AssetsManager({
  locale,
  brandId,
  assets,
  role,
  website,
}: {
  locale: Locale;
  brandId: string;
  assets: BrandAsset[];
  role: "editor" | "admin";
  /** Brand website — drives the "Suggest logo" button (domain → logo API). */
  website?: string | null;
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);
  const domain = websiteDomain(website);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.assetsTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-3">
        {assets.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {assets.map((a) => (
          <form
            key={a.id}
            action={(fd) => run(() => saveAsset(brandId, a.id, fd), msgs)}
            className="grid grid-cols-2 items-end gap-2 border-b border-line pb-3 sm:grid-cols-4"
          >
            <select name="asset_type" defaultValue={a.asset_type} className={inputCls} aria-label={t.assetType}>
              {ASSET_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input name="name_en" defaultValue={a.name_en} placeholder={t.assetName} className={inputCls} />
            <input name="name_ar" dir="rtl" defaultValue={a.name_ar} placeholder={t.assetNameAr} className={inputCls} />
            <select name="download_policy" defaultValue={a.download_policy} className={inputCls} aria-label={t.assetPolicy}>
              {POLICIES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input name="formats" defaultValue={(a.formats ?? []).join(", ")} placeholder={t.assetFormats} className={`${inputCls} sm:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={a.sort_order} className={inputCls} aria-label={t.sort} />
            <label className="flex items-center gap-2 text-[12px] text-muted">
              <input type="checkbox" name="is_archived" defaultChecked={a.is_archived} className="h-4 w-4 rounded border-line accent-ink" />
              {t.assetArchived}
            </label>
            <AssetImageField brandId={brandId} assetId={a.id} initial={a.image_url ?? null} domain={domain} t={t} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteAsset(brandId, a.id), msgs)}>{t.remove}</Button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveAsset(brandId, null, fd), msgs)} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-line pt-4 sm:grid-cols-4">
        <select name="asset_type" defaultValue="logo_primary" className={inputCls} aria-label={t.assetType}>
          {ASSET_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input name="name_en" placeholder={t.assetName} className={inputCls} />
        <input name="name_ar" dir="rtl" placeholder={t.assetNameAr} className={inputCls} />
        <select name="download_policy" defaultValue="host" className={inputCls} aria-label={t.assetPolicy}>
          {POLICIES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input name="formats" defaultValue="svg, png" placeholder={t.assetFormats} className={`${inputCls} sm:col-span-2`} />
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.sort} />
        <label className="flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" name="is_archived" className="h-4 w-4 rounded border-line accent-ink" />
          {t.assetArchived}
        </label>
        <AssetImageField brandId={brandId} assetId={null} initial={null} domain={domain} t={t} />
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- Timeline ---------------- */
export function TimelineManager({
  locale,
  brandId,
  entries,
  role,
}: {
  locale: Locale;
  brandId: string;
  entries: TimelineEntry[];
  role: "editor" | "admin";
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.timelineTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {entries.map((e) => (
          <form
            key={e.id}
            action={(fd) => run(() => saveTimeline(brandId, e.id, fd), msgs)}
            className="grid grid-cols-2 items-end gap-2 border-b border-line pb-3 sm:grid-cols-4"
          >
            <input name="year" type="number" defaultValue={e.year} placeholder={t.tlYear} className={inputCls} />
            <input name="title_en" defaultValue={e.title_en} placeholder={t.tlTitleEn} className={inputCls} />
            <input name="title_ar" dir="rtl" defaultValue={e.title_ar} placeholder={t.tlTitleAr} className={inputCls} />
            <input name="category" defaultValue={e.category ?? ""} placeholder={t.tlCategory} className={inputCls} />
            <input name="description_en" defaultValue={e.description_en ?? ""} placeholder={t.tlDescEn} className={`${inputCls} sm:col-span-2`} />
            <input name="description_ar" dir="rtl" defaultValue={e.description_ar ?? ""} placeholder={t.tlDescAr} className={`${inputCls} sm:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={e.sort_order} className={inputCls} aria-label={t.tlSort} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteTimeline(brandId, e.id), msgs)}>{t.remove}</Button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveTimeline(brandId, null, fd), msgs)} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-line pt-4 sm:grid-cols-4">
        <input name="year" type="number" defaultValue={new Date().getFullYear()} placeholder={t.tlYear} className={inputCls} />
        <input name="title_en" placeholder={t.tlTitleEn} className={inputCls} />
        <input name="title_ar" dir="rtl" placeholder={t.tlTitleAr} className={inputCls} />
        <input name="category" defaultValue="identity_update" placeholder={t.tlCategory} className={inputCls} />
        <input name="description_en" placeholder={t.tlDescEn} className={`${inputCls} sm:col-span-2`} />
        <input name="description_ar" dir="rtl" placeholder={t.tlDescAr} className={`${inputCls} sm:col-span-2`} />
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.tlSort} />
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- Fonts ---------------- */
const FONT_ROLES = ["display", "text", "mono", "arabic"];
const FONT_POLICIES = ["specimen_only", "host", "link_out"];

export function FontsManager({
  locale,
  brandId,
  fonts,
  role,
}: {
  locale: Locale;
  brandId: string;
  fonts: BrandFont[];
  role: "editor" | "admin";
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.fontsTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-3">
        {fonts.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {fonts.map((f) => (
          <form
            key={f.id}
            action={(fd) => run(() => saveFont(brandId, f.id, fd), msgs)}
            className="grid grid-cols-2 items-end gap-2 border-b border-line pb-3 sm:grid-cols-4"
          >
            <input name="family" defaultValue={f.family} placeholder={t.fontFamily} className={inputCls} />
            <select name="role" defaultValue={f.role ?? ""} className={inputCls} aria-label={t.fontRole}>
              <option value="">{t.fontRole}</option>
              {FONT_ROLES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input name="weights" defaultValue={f.weights ?? ""} placeholder={t.fontWeights} className={inputCls} />
            <select name="policy" defaultValue={f.policy} className={inputCls} aria-label={t.fontPolicy}>
              {FONT_POLICIES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input name="specimen_en" defaultValue={f.specimen_en ?? ""} placeholder={t.fontSpecimenEn} className={`${inputCls} sm:col-span-2`} />
            <input name="specimen_ar" dir="rtl" defaultValue={f.specimen_ar ?? ""} placeholder={t.fontSpecimenAr} className={`${inputCls} sm:col-span-2`} />
            <input name="foundry" defaultValue={f.foundry ?? ""} placeholder={t.fontFoundry} className={inputCls} />
            <input name="license" defaultValue={f.license ?? ""} placeholder={t.fontLicense} className={inputCls} />
            <input name="source_url" defaultValue={f.source_url ?? ""} placeholder={t.fontSourceUrl} className={inputCls} />
            <input name="css_stack" defaultValue={f.css_stack ?? ""} placeholder={t.fontCssStack} className={inputCls} />
            <input name="sort_order" type="number" defaultValue={f.sort_order} className={inputCls} aria-label={t.sort} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteFont(brandId, f.id), msgs)}>{t.remove}</Button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveFont(brandId, null, fd), msgs)} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-line pt-4 sm:grid-cols-4">
        <input name="family" placeholder={t.fontFamily} className={inputCls} />
        <select name="role" defaultValue="" className={inputCls} aria-label={t.fontRole}>
          <option value="">{t.fontRole}</option>
          {FONT_ROLES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input name="weights" placeholder={t.fontWeights} className={inputCls} />
        <select name="policy" defaultValue="specimen_only" className={inputCls} aria-label={t.fontPolicy}>
          {FONT_POLICIES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input name="specimen_en" placeholder={t.fontSpecimenEn} className={`${inputCls} sm:col-span-2`} />
        <input name="specimen_ar" dir="rtl" placeholder={t.fontSpecimenAr} className={`${inputCls} sm:col-span-2`} />
        <input name="foundry" placeholder={t.fontFoundry} className={inputCls} />
        <input name="license" placeholder={t.fontLicense} className={inputCls} />
        <input name="source_url" placeholder={t.fontSourceUrl} className={inputCls} />
        <input name="css_stack" placeholder={t.fontCssStack} className={inputCls} />
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.sort} />
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- Guidelines ---------------- */
const GUIDELINE_KINDS = ["do", "dont"];

export function GuidelinesManager({
  locale,
  brandId,
  guidelines,
  role,
}: {
  locale: Locale;
  brandId: string;
  guidelines: BrandGuideline[];
  role: "editor" | "admin";
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.guidelinesTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-3">
        {guidelines.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {guidelines.map((g) => (
          <form
            key={g.id}
            action={(fd) => run(() => saveGuideline(brandId, g.id, fd), msgs)}
            className="grid grid-cols-2 items-end gap-2 border-b border-line pb-3 sm:grid-cols-4"
          >
            <select name="kind" defaultValue={g.kind} className={inputCls} aria-label={t.guidelineKind}>
              {GUIDELINE_KINDS.map((x) => <option key={x} value={x}>{x === "do" ? t.guidelineDo : t.guidelineDont}</option>)}
            </select>
            <input name="sort_order" type="number" defaultValue={g.sort_order} className={inputCls} aria-label={t.sort} />
            <input name="text_en" defaultValue={g.text_en} placeholder={t.guidelineTextEn} className={`${inputCls} sm:col-span-2`} />
            <input name="text_ar" dir="rtl" defaultValue={g.text_ar ?? ""} placeholder={t.guidelineTextAr} className={`${inputCls} sm:col-span-2`} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteGuideline(brandId, g.id), msgs)}>{t.remove}</Button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveGuideline(brandId, null, fd), msgs)} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-line pt-4 sm:grid-cols-4">
        <select name="kind" defaultValue="do" className={inputCls} aria-label={t.guidelineKind}>
          {GUIDELINE_KINDS.map((x) => <option key={x} value={x}>{x === "do" ? t.guidelineDo : t.guidelineDont}</option>)}
        </select>
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.sort} />
        <input name="text_en" placeholder={t.guidelineTextEn} className={`${inputCls} sm:col-span-2`} />
        <input name="text_ar" dir="rtl" placeholder={t.guidelineTextAr} className={`${inputCls} sm:col-span-2`} />
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
        </div>
      </form>
    </Card>
  );
}

/* ---------------- Applications ---------------- */
const APPLICATION_CONTEXTS = ["app_icon", "signage", "packaging", "social", "billboard", "merch", "website"];

export function ApplicationsManager({
  locale,
  brandId,
  applications,
  role,
}: {
  locale: Locale;
  brandId: string;
  applications: BrandApplication[];
  role: "editor" | "admin";
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = childMessages(t, role);

  return (
    <Card>
      <h2 className={cardTitleCls}>{t.applicationsTitle}</h2>
      <ChildError error={error} />
      <div className="space-y-3">
        {applications.length === 0 && <p className="text-[14px] text-muted">{t.noRows}</p>}
        {applications.map((a) => (
          <form
            key={a.id}
            action={(fd) => run(() => saveApplication(brandId, a.id, fd), msgs)}
            className="grid grid-cols-2 items-end gap-2 border-b border-line pb-3 sm:grid-cols-4"
          >
            <select name="context" defaultValue={a.context} className={inputCls} aria-label={t.applicationContext}>
              {APPLICATION_CONTEXTS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input type="color" name="bg_color" defaultValue={a.bg_color ?? "#ffffff"} className="h-9 w-10 rounded-md border border-line" aria-label={t.applicationBgColor} />
            <input name="image_url" defaultValue={a.image_url ?? ""} placeholder={t.applicationImageUrl} className={`${inputCls} sm:col-span-2`} />
            <input name="caption_en" defaultValue={a.caption_en ?? ""} placeholder={t.applicationCaptionEn} className={`${inputCls} sm:col-span-2`} />
            <input name="caption_ar" dir="rtl" defaultValue={a.caption_ar ?? ""} placeholder={t.applicationCaptionAr} className={`${inputCls} sm:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={a.sort_order} className={inputCls} aria-label={t.sort} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>{t.save}</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteApplication(brandId, a.id), msgs)}>{t.remove}</Button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveApplication(brandId, null, fd), msgs)} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-line pt-4 sm:grid-cols-4">
        <select name="context" defaultValue="app_icon" className={inputCls} aria-label={t.applicationContext}>
          {APPLICATION_CONTEXTS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input type="color" name="bg_color" defaultValue="#ffffff" className="h-9 w-10 rounded-md border border-line" aria-label={t.applicationBgColor} />
        <input name="image_url" placeholder={t.applicationImageUrl} className={`${inputCls} sm:col-span-2`} />
        <input name="caption_en" placeholder={t.applicationCaptionEn} className={`${inputCls} sm:col-span-2`} />
        <input name="caption_ar" dir="rtl" placeholder={t.applicationCaptionAr} className={`${inputCls} sm:col-span-2`} />
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.sort} />
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>{t.add}</Button>
        </div>
      </form>
    </Card>
  );
}
