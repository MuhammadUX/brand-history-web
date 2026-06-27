"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, BrandColor, BrandAsset, TimelineEntry } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Card, Button } from "@/components/ui";
import {
  saveColor,
  deleteColor,
  saveAsset,
  deleteAsset,
  saveTimeline,
  deleteTimeline,
} from "@/app/[locale]/admin/brands/actions";

// Compact Library control surface for the dense child-row editors (smaller than
// the 44px Field/Input so a colour + name + role row fits one line).
const inputCls =
  "w-full rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[14px] text-ink placeholder:text-muted transition-colors duration-150 focus:border-link focus:outline-none focus-visible:outline-none";
const cardTitleCls =
  "mb-4 text-[13px] font-bold uppercase tracking-label text-muted";

type ChildResult = { ok: boolean; message?: string };

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
}: {
  locale: Locale;
  brandId: string;
  colors: BrandColor[];
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = { childPublished: t.childPublished, saveError: t.saveError, forbidden: t.saveError, conflict: t.conflict };

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

export function AssetsManager({
  locale,
  brandId,
  assets,
}: {
  locale: Locale;
  brandId: string;
  assets: BrandAsset[];
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = { childPublished: t.childPublished, saveError: t.saveError, forbidden: t.saveError, conflict: t.conflict };

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
}: {
  locale: Locale;
  brandId: string;
  entries: TimelineEntry[];
}) {
  const t = getDictionary(locale).admin.editor;
  const { pending, run, error } = useRefresh();
  const msgs = { childPublished: t.childPublished, saveError: t.saveError, forbidden: t.saveError, conflict: t.conflict };

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
