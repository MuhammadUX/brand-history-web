"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, BrandColor, BrandAsset, TimelineEntry } from "@/lib/types";
import { getDictionary } from "@/i18n";
import {
  saveColor,
  deleteColor,
  saveAsset,
  deleteAsset,
  saveTimeline,
  deleteTimeline,
} from "@/app/[locale]/admin/brands/actions";

const inputCls =
  "w-full rounded-btn border border-border bg-page px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const cardCls = "rounded-card border border-border bg-surface p-5";
const addBtn =
  "rounded-btn bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60";
const ghostBtn =
  "rounded-btn border border-border px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-page disabled:opacity-60";
const delBtn =
  "rounded-btn border border-border px-2.5 py-1.5 text-xs font-medium text-sponsored transition hover:bg-sponsoredBg disabled:opacity-60";

function useRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });
  return { pending, run };
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
  const { pending, run } = useRefresh();

  return (
    <div className={cardCls}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{t.colorsTitle}</h2>
      <div className="space-y-2">
        {colors.length === 0 && <p className="text-sm text-tertiary">{t.noRows}</p>}
        {colors.map((c) => (
          <form
            key={c.id}
            action={(fd) => run(() => saveColor(brandId, c.id, fd))}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="color" name="hex" defaultValue={c.hex} className="h-9 w-10 rounded-btn border border-border" aria-label={t.colorHex} />
            <input name="name" defaultValue={c.name} placeholder={t.colorName} className={`${inputCls} w-32`} />
            <input name="role" defaultValue={c.role} placeholder={t.colorRole} className={`${inputCls} w-28`} />
            <input name="sort_order" type="number" defaultValue={c.sort_order} className={`${inputCls} w-16`} aria-label={t.sort} />
            <button type="submit" disabled={pending} className={ghostBtn}>{t.save}</button>
            <button type="button" disabled={pending} onClick={() => run(() => deleteColor(brandId, c.id))} className={delBtn}>{t.remove}</button>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveColor(brandId, null, fd))} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <input type="color" name="hex" defaultValue="#3B5BDB" className="h-9 w-10 rounded-btn border border-border" aria-label={t.colorHex} />
        <input name="name" placeholder={t.colorName} className={`${inputCls} w-32`} />
        <input name="role" defaultValue="primary" placeholder={t.colorRole} className={`${inputCls} w-28`} />
        <input name="sort_order" type="number" defaultValue={0} className={`${inputCls} w-16`} aria-label={t.sort} />
        <button type="submit" disabled={pending} className={addBtn}>{t.add}</button>
      </form>
    </div>
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
  const { pending, run } = useRefresh();

  return (
    <div className={cardCls}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{t.assetsTitle}</h2>
      <div className="space-y-3">
        {assets.length === 0 && <p className="text-sm text-tertiary">{t.noRows}</p>}
        {assets.map((a) => (
          <form
            key={a.id}
            action={(fd) => run(() => saveAsset(brandId, a.id, fd))}
            className="grid grid-cols-2 items-end gap-2 border-b border-border pb-3 sm:grid-cols-4"
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
            <label className="flex items-center gap-2 text-xs text-secondary">
              <input type="checkbox" name="is_archived" defaultChecked={a.is_archived} className="h-4 w-4 rounded border-border" />
              {t.assetArchived}
            </label>
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <button type="submit" disabled={pending} className={ghostBtn}>{t.save}</button>
              <button type="button" disabled={pending} onClick={() => run(() => deleteAsset(brandId, a.id))} className={delBtn}>{t.remove}</button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveAsset(brandId, null, fd))} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-border pt-4 sm:grid-cols-4">
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
        <label className="flex items-center gap-2 text-xs text-secondary">
          <input type="checkbox" name="is_archived" className="h-4 w-4 rounded border-border" />
          {t.assetArchived}
        </label>
        <div className="col-span-2 sm:col-span-4">
          <button type="submit" disabled={pending} className={addBtn}>{t.add}</button>
        </div>
      </form>
    </div>
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
  const { pending, run } = useRefresh();

  return (
    <div className={cardCls}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{t.timelineTitle}</h2>
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-tertiary">{t.noRows}</p>}
        {entries.map((e) => (
          <form
            key={e.id}
            action={(fd) => run(() => saveTimeline(brandId, e.id, fd))}
            className="grid grid-cols-2 items-end gap-2 border-b border-border pb-3 sm:grid-cols-4"
          >
            <input name="year" type="number" defaultValue={e.year} placeholder={t.tlYear} className={inputCls} />
            <input name="title_en" defaultValue={e.title_en} placeholder={t.tlTitleEn} className={inputCls} />
            <input name="title_ar" dir="rtl" defaultValue={e.title_ar} placeholder={t.tlTitleAr} className={inputCls} />
            <input name="category" defaultValue={e.category ?? ""} placeholder={t.tlCategory} className={inputCls} />
            <input name="description_en" defaultValue={e.description_en ?? ""} placeholder={t.tlDescEn} className={`${inputCls} sm:col-span-2`} />
            <input name="description_ar" dir="rtl" defaultValue={e.description_ar ?? ""} placeholder={t.tlDescAr} className={`${inputCls} sm:col-span-2`} />
            <input name="sort_order" type="number" defaultValue={e.sort_order} className={inputCls} aria-label={t.tlSort} />
            <div className="col-span-2 flex gap-2 sm:col-span-4">
              <button type="submit" disabled={pending} className={ghostBtn}>{t.save}</button>
              <button type="button" disabled={pending} onClick={() => run(() => deleteTimeline(brandId, e.id))} className={delBtn}>{t.remove}</button>
            </div>
          </form>
        ))}
      </div>
      <form action={(fd) => run(() => saveTimeline(brandId, null, fd))} className="mt-4 grid grid-cols-2 items-end gap-2 border-t border-border pt-4 sm:grid-cols-4">
        <input name="year" type="number" defaultValue={new Date().getFullYear()} placeholder={t.tlYear} className={inputCls} />
        <input name="title_en" placeholder={t.tlTitleEn} className={inputCls} />
        <input name="title_ar" dir="rtl" placeholder={t.tlTitleAr} className={inputCls} />
        <input name="category" defaultValue="identity_update" placeholder={t.tlCategory} className={inputCls} />
        <input name="description_en" placeholder={t.tlDescEn} className={`${inputCls} sm:col-span-2`} />
        <input name="description_ar" dir="rtl" placeholder={t.tlDescAr} className={`${inputCls} sm:col-span-2`} />
        <input name="sort_order" type="number" defaultValue={0} className={inputCls} aria-label={t.tlSort} />
        <div className="col-span-2 sm:col-span-4">
          <button type="submit" disabled={pending} className={addBtn}>{t.add}</button>
        </div>
      </form>
    </div>
  );
}
