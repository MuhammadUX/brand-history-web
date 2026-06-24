"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Sector, Brand } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { slugify, CLAIM_STATUSES } from "@/lib/admin-shared";
import {
  createBrand,
  updateBrand,
  transitionBrand,
  type ActionResult,
} from "@/app/[locale]/admin/brands/actions";

const initial: ActionResult = { ok: false };

const inputCls =
  "w-full rounded-btn border border-border bg-page px-3 py-2 text-sm text-ink placeholder:text-tertiary focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelCls = "mb-1 block text-xs font-medium text-secondary";

export interface BrandPrefill {
  name_en?: string;
  region?: string;
}

export default function BrandEditorForm({
  locale,
  sectors,
  brand,
  role,
  prefill,
}: {
  locale: Locale;
  sectors: Sector[];
  brand: Brand | null;
  role: "editor" | "admin";
  prefill?: BrandPrefill | null;
}) {
  const dict = getDictionary(locale);
  const t = dict.admin.editor;
  const router = useRouter();
  const isNew = !brand;

  const boundAction = isNew
    ? createBrand.bind(null, locale)
    : updateBrand.bind(null, locale, brand!.id);
  const [state, formAction, pending] = useActionState(boundAction, initial);

  const [nameEn, setNameEn] = useState(brand?.name_en ?? prefill?.name_en ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(brand?.slug));
  const [color, setColor] = useState(brand?.primary_color ?? "#3B5BDB");

  // current row_version reflects successful saves so subsequent saves don't conflict
  const [rowVersion, setRowVersion] = useState(
    brand ? (brand as unknown as { row_version?: number }).row_version ?? 0 : 0
  );

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nameEn));
  }, [nameEn, slugTouched]);

  useEffect(() => {
    if (state.ok && state.id) {
      router.replace(`/${locale}/admin/brands/${state.id}`);
      router.refresh();
    }
    if (state.ok && typeof state.rowVersion === "number") {
      setRowVersion(state.rowVersion);
    }
  }, [state, locale, router]);

  const claimLabels = t.claim as Record<string, string>;

  return (
    <div className="space-y-4">
      {state.message === "conflict" && (
        <p className="rounded-btn border border-sponsored/40 bg-sponsoredBg px-3 py-2 text-sm text-sponsored">
          {t.conflict}
        </p>
      )}
      {state.message === "saveError" && (
        <p className="rounded-btn border border-border bg-page px-3 py-2 text-sm text-ink">
          {t.saveError}
        </p>
      )}
      {state.ok && state.message === "saved" && (
        <p className="rounded-btn border border-success/30 bg-verifiedBg px-3 py-2 text-sm text-success">
          {t.saved}
        </p>
      )}

      <form
        action={formAction}
        className="rounded-card border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-ink">{t.sectionBasics}</h2>
        {!isNew && <input type="hidden" name="row_version" value={rowVersion} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="name_en">{t.nameEn}</label>
            <input
              id="name_en"
              name="name_en"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="name_ar">{t.nameAr}</label>
            <input
              id="name_ar"
              name="name_ar"
              dir="rtl"
              defaultValue={brand?.name_ar ?? ""}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="slug">{t.slug}</label>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-tertiary">{t.slugHint}</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="sector_id">{t.sector}</label>
            <select
              id="sector_id"
              name="sector_id"
              defaultValue={brand?.sector_id ?? ""}
              className={inputCls}
            >
              <option value="">{t.selectSector}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === "ar" ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="region">{t.region}</label>
            <input
              id="region"
              name="region"
              defaultValue={brand?.region ?? prefill?.region ?? "KSA"}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="founded_year">{t.foundedYear}</label>
            <input
              id="founded_year"
              name="founded_year"
              type="number"
              defaultValue={brand?.founded_year ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="initials">{t.initials}</label>
            <input
              id="initials"
              name="initials"
              maxLength={4}
              defaultValue={brand?.initials ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="primary_color">{t.primaryColor}</label>
            <div className="flex items-center gap-2">
              <input
                id="primary_color"
                name="primary_color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-btn border border-border bg-surface"
              />
              <input
                aria-label={t.primaryColor}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="claim_status">{t.claimStatus}</label>
            <select
              id="claim_status"
              name="claim_status"
              defaultValue={brand?.claim_status ?? "unclaimed"}
              className={inputCls}
            >
              {CLAIM_STATUSES.map((c) => (
                <option key={c} value={c}>{claimLabels[c]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="summary_en">{t.summaryEn}</label>
            <textarea
              id="summary_en"
              name="summary_en"
              rows={3}
              defaultValue={brand?.summary_en ?? ""}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="summary_ar">{t.summaryAr}</label>
            <textarea
              id="summary_ar"
              name="summary_ar"
              dir="rtl"
              rows={3}
              defaultValue={brand?.summary_ar ?? ""}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? t.saving : t.saveDraft}
          </button>
        </div>
      </form>

      {!isNew && (
        <StateMachine
          locale={locale}
          brandId={brand!.id}
          state={brand!.publication_state}
          rowVersion={rowVersion}
          role={role}
        />
      )}
    </div>
  );
}

function StateMachine({
  locale,
  brandId,
  state,
  rowVersion,
  role,
}: {
  locale: Locale;
  brandId: string;
  state: string;
  rowVersion: number;
  role: "editor" | "admin";
}) {
  const dict = getDictionary(locale);
  const t = dict.admin.editor;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [validation, setValidation] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<"transitionDone" | "conflict" | "saveError" | "forbidden" | null>(
    null
  );
  const vLabels = t as unknown as Record<string, string>;

  function run(action: "submit" | "approve" | "publish" | "unpublish") {
    setValidation(null);
    setMsg(null);
    startTransition(async () => {
      const res = await transitionBrand(locale, brandId, action, rowVersion);
      if (res.validation) {
        setValidation(res.validation);
        return;
      }
      if (!res.ok) {
        const m = res.message;
        setMsg(m === "conflict" || m === "transitionDone" || m === "forbidden" ? m : "saveError");
        return;
      }
      router.refresh();
    });
  }

  const canApprove = role === "admin";
  const canPublish = role === "admin";

  const buttons: { key: "submit" | "approve" | "publish" | "unpublish"; label: string; show: boolean; disabled: boolean }[] = [
    { key: "submit", label: t.submitReview, show: state === "draft", disabled: false },
    { key: "approve", label: t.approve, show: state === "in_review", disabled: !canApprove },
    { key: "publish", label: t.publish, show: state === "approved" || state === "unpublished", disabled: !canPublish },
    { key: "unpublish", label: t.unpublish, show: state === "published", disabled: false },
  ];

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-ink">{t.stateLabel}</h2>
      <p className="mb-4 text-xs text-tertiary">
        {(dict.admin.dashboard.states as Record<string, string>)[state] ?? state}
      </p>

      {msg === "transitionDone" && (
        <p className="mb-3 rounded-btn bg-verifiedBg px-3 py-2 text-sm text-success">{t.transitionDone}</p>
      )}
      {msg === "conflict" && (
        <p className="mb-3 rounded-btn bg-sponsoredBg px-3 py-2 text-sm text-sponsored">{t.conflict}</p>
      )}
      {(msg === "saveError" || msg === "forbidden") && (
        <p className="mb-3 rounded-btn bg-page px-3 py-2 text-sm text-ink">{t.saveError}</p>
      )}
      {validation && validation.length > 0 && (
        <div className="mb-3 rounded-btn border border-sponsored/40 bg-sponsoredBg px-3 py-2 text-sm text-sponsored">
          <p className="font-medium">{t.validationTitle}</p>
          <ul className="mt-1 list-disc ps-5">
            {validation.map((v) => (
              <li key={v}>{vLabels[v] ?? v}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {buttons.filter((b) => b.show).map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => run(b.key)}
            disabled={pending || b.disabled}
            title={b.disabled ? t.adminOnly : undefined}
            className="rounded-btn border border-border bg-page px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {b.label}
            {b.disabled ? ` · ${t.adminOnly}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
