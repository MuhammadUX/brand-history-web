"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDraftBrand } from "@/app/[locale]/admin/brands/actions";

/**
 * Delete control for a DRAFT brand (admin-only; the server action re-checks
 * both). Confirms before deleting, then refreshes the list.
 */
export default function DeleteDraftButton({
  brandId,
  label,
  confirmText,
}: {
  brandId: string;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  function onClick() {
    if (!window.confirm(confirmText)) return;
    setErr(false);
    start(async () => {
      const res = await deleteDraftBrand(brandId);
      if (res.ok) router.refresh();
      else setErr(true);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-pill border border-danger/40 px-3 py-1.5 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-50 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
    >
      {err ? "✕" : pending ? "…" : label}
    </button>
  );
}
