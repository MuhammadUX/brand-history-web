"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import {
  Table,
  THead,
  TRow,
  TCell,
  Button,
  Checkbox,
  Toast,
  useToast,
} from "@/components/ui";
import StateBadge from "@/components/admin/StateBadge";
import DeleteDraftButton from "@/components/admin/DeleteDraftButton";
import {
  bulkBrandAction,
  type BulkAction,
} from "@/app/[locale]/admin/brands/actions";

export interface BulkBrandRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  publication_state: string;
  claim_status: string;
  sectorLabel: string;
  updatedLabel: string;
}

export interface BrandsBulkTableProps {
  locale: Locale;
  rows: BulkBrandRow[];
  isAdmin: boolean;
}

/**
 * Client table for the brands list: row checkboxes + select-all (this page) +
 * a bulk action toolbar (Delete / Archive / Publish, admin-only) with a confirm
 * step for destructive actions and a result summary. Keeps the existing
 * per-row Delete button for admins on draft/archived brands.
 */
export default function BrandsBulkTable({
  locale,
  rows,
  isAdmin,
}: BrandsBulkTableProps) {
  const dict = getDictionary(locale);
  const t = dict.admin.brands;
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;
  const someSelected = selected.size > 0;

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }

  function fill(tpl: string, vars: Record<string, number>): string {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
  }

  function runBulk(action: BulkAction) {
    if (!isAdmin || selected.size === 0) return;
    const confirmText =
      action === "delete"
        ? t.bulkDeleteConfirm
        : action === "archive"
          ? t.bulkArchiveConfirm
          : t.bulkPublishConfirm;
    if (!window.confirm(confirmText)) return;
    const ids = Array.from(selected);
    start(async () => {
      const res = await bulkBrandAction(locale, ids, action);
      if (!res.ok) {
        toast.show(
          res.message === "forbidden" ? t.bulkForbidden : t.bulkError,
          2500
        );
        return;
      }
      const parts: string[] = [
        fill(t.bulkSummaryDone, { succeeded: res.succeeded }),
      ];
      if (res.skipped > 0)
        parts.push(fill(t.bulkSummarySkipped, { skipped: res.skipped }));
      if (res.failed > 0)
        parts.push(fill(t.bulkSummaryFailed, { failed: res.failed }));
      toast.show(parts.join(" · "), 3000);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {isAdmin && someSelected && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
          <span className="text-[13px] font-semibold text-ink">
            {fill(t.selectedCount, { n: selected.size })}
          </span>
          <span className="grow" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => runBulk("publish")}
            disabled={pending}
          >
            {t.bulkPublish}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => runBulk("archive")}
            disabled={pending}
          >
            {t.bulkArchive}
          </Button>
          <button
            type="button"
            onClick={() => runBulk("delete")}
            disabled={pending}
            className="rounded-pill border border-danger/40 px-3 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            {pending ? t.bulkRunning : t.bulkDelete}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
            disabled={pending}
          >
            {t.bulkClear}
          </Button>
        </div>
      )}

      <Table>
        <THead>
          {isAdmin && (
            <TCell head className="w-10">
              <Checkbox
                aria-label={t.selectAll}
                checked={allSelected}
                onChange={toggleAll}
              />
            </TCell>
          )}
          <TCell head>{t.colName}</TCell>
          <TCell head>{t.colState}</TCell>
          <TCell head className="hidden sm:table-cell">
            {t.colClaim}
          </TCell>
          <TCell head className="hidden md:table-cell">
            {t.colSector}
          </TCell>
          <TCell head className="hidden lg:table-cell">
            {t.colUpdated}
          </TCell>
          <TCell head>
            <span className="sr-only">{t.colActions}</span>
          </TCell>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 7 : 6}
                className="px-4 py-10 text-center text-[14px] text-muted"
              >
                {t.empty}
              </td>
            </tr>
          ) : (
            rows.map((b) => {
              const claimLabels = dict.admin.editor.claim as Record<
                string,
                string
              >;
              return (
                <TRow key={b.id}>
                  {isAdmin && (
                    <TCell className="w-10">
                      <Checkbox
                        aria-label={t.selectRow}
                        checked={selected.has(b.id)}
                        onChange={() => toggleRow(b.id)}
                      />
                    </TCell>
                  )}
                  <TCell>
                    <Link
                      href={`/${locale}/admin/brands/${b.id}`}
                      className="font-medium text-ink hover:text-link"
                    >
                      {locale === "ar" ? b.name_ar || b.name_en : b.name_en}
                    </Link>
                    <span className="block text-[12px] text-muted">{b.slug}</span>
                  </TCell>
                  <TCell>
                    <StateBadge state={b.publication_state} locale={locale} />
                  </TCell>
                  <TCell className="hidden text-muted sm:table-cell">
                    {claimLabels[b.claim_status] ?? b.claim_status}
                  </TCell>
                  <TCell className="hidden text-muted md:table-cell">
                    {b.sectorLabel}
                  </TCell>
                  <TCell className="hidden text-muted lg:table-cell">
                    {b.updatedLabel}
                  </TCell>
                  <TCell className="text-end">
                    {(b.publication_state === "draft" ||
                      b.publication_state === "archived") &&
                    isAdmin ? (
                      <DeleteDraftButton
                        brandId={b.id}
                        label={t.delete}
                        confirmText={t.deleteConfirm}
                      />
                    ) : null}
                  </TCell>
                </TRow>
              );
            })
          )}
        </tbody>
      </Table>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
