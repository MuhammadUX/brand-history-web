"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Sector, Brand } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { slugify, CLAIM_STATUSES } from "@/lib/admin-shared";
import { Card, Field, Input, Textarea, Select, Button } from "@/components/ui";
import {
  createBrand,
  updateBrand,
  transitionBrand,
  type ActionResult,
} from "@/app/[locale]/admin/brands/actions";

const initial: ActionResult = { ok: false };

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
        <p className="rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.conflict}
        </p>
      )}
      {state.message === "slugTaken" && (
        <p className="rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.slugTaken}
        </p>
      )}
      {state.message === "forbidden" && (
        <p className="rounded-md border border-danger/30 bg-[#fdeced] px-3 py-2 text-[14px] text-danger">
          {t.forbidden}
        </p>
      )}
      {state.message === "saveError" && (
        <p className="rounded-md border border-line bg-surface-2 px-3 py-2 text-[14px] text-ink">
          {t.saveError}
        </p>
      )}
      {state.ok && state.message === "saved" && (
        <p className="rounded-md border border-[#bfe6cd] bg-[#eef9f1] px-3 py-2 text-[14px] text-ok">
          {t.saved}
        </p>
      )}

      <form action={formAction}>
        <Card>
          <h2 className="mb-4 text-[13px] font-bold uppercase tracking-label text-muted">
            {t.sectionBasics}
          </h2>
          {!isNew && <input type="hidden" name="row_version" value={rowVersion} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.nameEn} htmlFor="name_en" required>
              <Input
                id="name_en"
                name="name_en"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </Field>
            <Field label={t.nameAr} htmlFor="name_ar">
              <Input
                id="name_ar"
                name="name_ar"
                dir="rtl"
                defaultValue={brand?.name_ar ?? ""}
              />
            </Field>
            <Field
              label={t.slug}
              htmlFor="slug"
              hint={t.slugHint}
              className="sm:col-span-2"
            >
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </Field>
            <Field label={t.sector} htmlFor="sector_id">
              <Select
                id="sector_id"
                name="sector_id"
                defaultValue={brand?.sector_id ?? ""}
              >
                <option value="">{t.selectSector}</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {locale === "ar" ? s.name_ar : s.name_en}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.region} htmlFor="region">
              <Input
                id="region"
                name="region"
                defaultValue={brand?.region ?? prefill?.region ?? "KSA"}
              />
            </Field>
            <Field label={t.foundedYear} htmlFor="founded_year">
              <Input
                id="founded_year"
                name="founded_year"
                type="number"
                defaultValue={brand?.founded_year ?? ""}
              />
            </Field>
            <Field label={t.initials} htmlFor="initials">
              <Input
                id="initials"
                name="initials"
                maxLength={4}
                defaultValue={brand?.initials ?? ""}
              />
            </Field>
            <Field label={t.primaryColor} htmlFor="primary_color">
              <div className="flex items-center gap-2">
                <input
                  id="primary_color"
                  name="primary_color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-line bg-surface"
                />
                <Input
                  aria-label={t.primaryColor}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </Field>
            <Field label={t.claimStatus} htmlFor="claim_status">
              <Select
                id="claim_status"
                name="claim_status"
                defaultValue={brand?.claim_status ?? "unclaimed"}
              >
                {CLAIM_STATUSES.map((c) => (
                  <option key={c} value={c}>
                    {claimLabels[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.summaryEn} htmlFor="summary_en" className="sm:col-span-2">
              <Textarea
                id="summary_en"
                name="summary_en"
                rows={3}
                defaultValue={brand?.summary_en ?? ""}
              />
            </Field>
            <Field label={t.summaryAr} htmlFor="summary_ar" className="sm:col-span-2">
              <Textarea
                id="summary_ar"
                name="summary_ar"
                dir="rtl"
                rows={3}
                defaultValue={brand?.summary_ar ?? ""}
              />
            </Field>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" disabled={pending}>
              {pending ? t.saving : t.saveDraft}
            </Button>
          </div>
        </Card>
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

  function run(
    action: "submit" | "approve" | "publish" | "unpublish" | "archive" | "restore"
  ) {
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
  const isAdmin = role === "admin";

  const buttons: {
    key: "submit" | "approve" | "publish" | "unpublish" | "archive" | "restore";
    label: string;
    show: boolean;
    disabled: boolean;
  }[] = [
    { key: "submit", label: t.submitReview, show: state === "draft", disabled: false },
    { key: "approve", label: t.approve, show: state === "in_review", disabled: !canApprove },
    { key: "publish", label: t.publish, show: state === "approved" || state === "unpublished", disabled: !canPublish },
    { key: "unpublish", label: t.unpublish, show: state === "published", disabled: false },
    // Archive any non-archived state; Restore from archived. Admin-only.
    {
      key: "archive",
      label: t.archive,
      show: state !== "archived",
      disabled: !isAdmin,
    },
    { key: "restore", label: t.restore, show: state === "archived", disabled: !isAdmin },
  ];

  return (
    <Card>
      <h2 className="mb-1 text-[13px] font-bold uppercase tracking-label text-muted">
        {t.stateLabel}
      </h2>
      <p className="mb-4 text-[12px] text-muted">
        {(dict.admin.dashboard.states as Record<string, string>)[state] ?? state}
      </p>

      {msg === "transitionDone" && (
        <p className="mb-3 rounded-md border border-[#bfe6cd] bg-[#eef9f1] px-3 py-2 text-[14px] text-ok">
          {t.transitionDone}
        </p>
      )}
      {msg === "conflict" && (
        <p className="mb-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
          {t.conflict}
        </p>
      )}
      {msg === "forbidden" && (
        <p className="mb-3 rounded-md border border-danger/30 bg-[#fdeced] px-3 py-2 text-[14px] text-danger">
          {t.forbidden}
        </p>
      )}
      {msg === "saveError" && (
        <p className="mb-3 rounded-md border border-line bg-surface-2 px-3 py-2 text-[14px] text-ink">
          {t.saveError}
        </p>
      )}
      {validation && validation.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-[14px] text-amber">
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
          <Button
            key={b.key}
            type="button"
            variant="ghost"
            size="md"
            onClick={() => run(b.key)}
            disabled={pending || b.disabled}
            title={b.disabled ? t.adminOnly : undefined}
          >
            {b.label}
            {b.disabled ? ` · ${t.adminOnly}` : ""}
          </Button>
        ))}
      </div>
    </Card>
  );
}
