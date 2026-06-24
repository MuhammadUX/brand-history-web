"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { markRequestReviewed } from "@/app/[locale]/admin/requests/actions";

export default function RequestActions({
  locale,
  id,
  reviewed,
}: {
  locale: Locale;
  id: string;
  reviewed: boolean;
}) {
  const t = getDictionary(locale).admin.requests;
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!reviewed && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markRequestReviewed(locale, id);
              router.refresh();
            })
          }
          className="rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-page disabled:opacity-60"
        >
          {t.markReviewed}
        </button>
      )}
      <Link
        href={`/${locale}/admin/brands/new?from=${id}`}
        className="rounded-btn bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover"
      >
        {t.createBrand}
      </Link>
    </div>
  );
}
