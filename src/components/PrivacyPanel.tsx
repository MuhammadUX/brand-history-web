"use client";

import { useState, useTransition } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import {
  exportMyData,
  requestAccountDeletion,
} from "@/app/[locale]/account/privacy-actions";
import { Button, Card } from "@/components/ui";

export default function PrivacyPanel({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [pending, startTransition] = useTransition();
  const [exportMsg, setExportMsg] = useState("");
  const [exportErr, setExportErr] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  function onExport() {
    setExportErr("");
    setExportMsg("");
    startTransition(async () => {
      const res = await exportMyData();
      if (!res.ok) {
        setExportErr(dict.privacy.error);
        return;
      }
      try {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `brand-history-data-${
          new Date().toISOString().slice(0, 10)
        }.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setExportMsg(dict.privacy.exportDone);
      } catch {
        setExportErr(dict.privacy.error);
      }
    });
  }

  function onConfirmDelete() {
    setDeleteErr("");
    startTransition(async () => {
      const res = await requestAccountDeletion();
      if (!res.ok) {
        setDeleteErr(dict.privacy.error);
        return;
      }
      setConfirming(false);
      setDeletePending(true);
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Export */}
      <Card>
        <h3 className="text-[15px] font-bold leading-tight text-ink">
          {dict.privacy.exportTitle}
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-muted">
          {dict.privacy.exportBody}
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            onClick={onExport}
            disabled={pending}
          >
            {pending ? dict.privacy.exporting : dict.privacy.exportButton}
          </Button>
        </div>
        {exportMsg && (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-ok"
          >
            <span aria-hidden="true">✓</span>
            {exportMsg}
          </p>
        )}
        {exportErr && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-danger"
          >
            <span aria-hidden="true">⚠</span>
            {exportErr}
          </p>
        )}
      </Card>

      {/* Delete */}
      <Card>
        <h3 className="text-[15px] font-bold leading-tight text-ink">
          {dict.privacy.deleteTitle}
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-muted">
          {dict.privacy.deleteBody}
        </p>

        <div className="mt-4 rounded-md border border-line bg-surface-2 p-4">
          <p className="label text-ink">
            {dict.privacy.deleteConsequencesTitle}
          </p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-[13px] text-muted">
            <li>{dict.privacy.deleteC1}</li>
            <li>{dict.privacy.deleteC2}</li>
            <li>{dict.privacy.deleteC3}</li>
          </ul>
        </div>

        {deletePending ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-md border border-danger/40 bg-danger/5 p-4"
          >
            <p className="text-[15px] font-bold leading-tight text-danger">
              {dict.privacy.deletePending}
            </p>
            <p className="mt-1 text-[13px] text-ink">
              {dict.privacy.deletePendingNote}
            </p>
          </div>
        ) : confirming ? (
          <div className="mt-4 rounded-md border border-line bg-surface-2 p-4">
            <p className="label text-ink">{dict.privacy.deleteConfirmTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={onConfirmDelete}
                disabled={pending}
              >
                {pending ? dict.privacy.deleting : dict.privacy.deleteConfirm}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                {dict.privacy.deleteCancel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirming(true)}
            >
              {dict.privacy.deleteButton}
            </Button>
          </div>
        )}
        {deleteErr && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-danger"
          >
            <span aria-hidden="true">⚠</span>
            {deleteErr}
          </p>
        )}
      </Card>
    </div>
  );
}
