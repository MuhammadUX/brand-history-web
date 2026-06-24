"use client";

import { useState, useTransition } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import {
  exportMyData,
  requestAccountDeletion,
} from "@/app/[locale]/account/privacy-actions";

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
      <section className="rounded-card border border-border bg-surface p-6">
        <h3 className="text-base font-bold text-ink">
          {dict.privacy.exportTitle}
        </h3>
        <p className="mt-1 text-sm text-secondary">{dict.privacy.exportBody}</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={onExport}
            disabled={pending}
            className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {pending ? dict.privacy.exporting : dict.privacy.exportButton}
          </button>
        </div>
        {exportMsg && (
          <p role="status" aria-live="polite" className="mt-3 text-sm font-medium text-success">
            {exportMsg}
          </p>
        )}
        {exportErr && (
          <p role="alert" className="mt-3 text-sm font-medium text-sponsored">
            {exportErr}
          </p>
        )}
      </section>

      {/* Delete */}
      <section className="rounded-card border border-border bg-surface p-6">
        <h3 className="text-base font-bold text-ink">
          {dict.privacy.deleteTitle}
        </h3>
        <p className="mt-1 text-sm text-secondary">{dict.privacy.deleteBody}</p>

        <div className="mt-4 rounded-card border border-border bg-page p-4">
          <p className="text-sm font-semibold text-ink">
            {dict.privacy.deleteConsequencesTitle}
          </p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-secondary">
            <li>{dict.privacy.deleteC1}</li>
            <li>{dict.privacy.deleteC2}</li>
            <li>{dict.privacy.deleteC3}</li>
          </ul>
        </div>

        {deletePending ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-card border border-sponsored/30 bg-sponsoredBg p-4"
          >
            <p className="text-sm font-bold text-sponsored">
              {dict.privacy.deletePending}
            </p>
            <p className="mt-1 text-sm text-ink">
              {dict.privacy.deletePendingNote}
            </p>
          </div>
        ) : confirming ? (
          <div className="mt-4 rounded-card border border-border bg-page p-4">
            <p className="text-sm font-semibold text-ink">
              {dict.privacy.deleteConfirmTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={pending}
                className="rounded-btn bg-sponsored px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {pending ? dict.privacy.deleting : dict.privacy.deleteConfirm}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {dict.privacy.deleteCancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-btn border border-sponsored/40 bg-surface px-4 py-2.5 text-sm font-semibold text-sponsored transition hover:bg-sponsoredBg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.privacy.deleteButton}
            </button>
          </div>
        )}
        {deleteErr && (
          <p role="alert" className="mt-3 text-sm font-medium text-sponsored">
            {deleteErr}
          </p>
        )}
      </section>
    </div>
  );
}
