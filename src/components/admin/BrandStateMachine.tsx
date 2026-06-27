"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Card, Button } from "@/components/ui";
import { transitionBrand } from "@/app/[locale]/admin/brands/actions";

export interface BrandStateMachineProps {
  locale: Locale;
  brandId: string;
  state: string;
  rowVersion: number;
  role: "editor" | "admin";
  /**
   * "card"  → boxed panel used inside the editor form (default).
   * "bar"   → compact horizontal bar for the sticky top action bar.
   */
  variant?: "card" | "bar";
}

type TransitionKey =
  | "submit"
  | "approve"
  | "publish"
  | "unpublish"
  | "archive"
  | "restore";

/**
 * BrandStateMachine — lifecycle transition controls for a single brand.
 * Extracted from BrandEditorForm so it can be reused both as a boxed panel in
 * the editor and as the sticky top action bar on the detail page. Respects the
 * existing role/state gating and the distinct "admin only" / forbidden copy.
 */
export default function BrandStateMachine({
  locale,
  brandId,
  state,
  rowVersion,
  role,
  variant = "card",
}: BrandStateMachineProps) {
  const dict = getDictionary(locale);
  const t = dict.admin.editor;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [validation, setValidation] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<
    "transitionDone" | "conflict" | "saveError" | "forbidden" | null
  >(null);
  const vLabels = t as unknown as Record<string, string>;

  function run(action: TransitionKey) {
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
        setMsg(
          m === "conflict" || m === "transitionDone" || m === "forbidden"
            ? m
            : "saveError"
        );
        return;
      }
      router.refresh();
    });
  }

  const isAdmin = role === "admin";

  const buttons: {
    key: TransitionKey;
    label: string;
    show: boolean;
    disabled: boolean;
  }[] = [
    { key: "submit", label: t.submitReview, show: state === "draft", disabled: false },
    { key: "approve", label: t.approve, show: state === "in_review", disabled: !isAdmin },
    {
      key: "publish",
      label: t.publish,
      show: state === "approved" || state === "unpublished",
      disabled: !isAdmin,
    },
    { key: "unpublish", label: t.unpublish, show: state === "published", disabled: false },
    // Archive any non-archived state; Restore from archived. Admin-only.
    { key: "archive", label: t.archive, show: state !== "archived", disabled: !isAdmin },
    { key: "restore", label: t.restore, show: state === "archived", disabled: !isAdmin },
  ];

  const messages = (
    <>
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
    </>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {buttons
        .filter((b) => b.show)
        .map((b) => (
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
  );

  if (variant === "bar") {
    return (
      <div>
        {messages}
        {actionButtons}
      </div>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 text-[13px] font-bold uppercase tracking-label text-muted">
        {t.stateLabel}
      </h2>
      <p className="mb-4 text-[12px] text-muted">
        {(dict.admin.dashboard.states as Record<string, string>)[state] ?? state}
      </p>
      {messages}
      {actionButtons}
    </Card>
  );
}
