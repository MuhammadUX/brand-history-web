"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Button } from "@/components/ui";
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markRequestReviewed(locale, id);
              router.refresh();
            })
          }
        >
          {t.markReviewed}
        </Button>
      )}
      <Button href={`/${locale}/admin/brands/new?from=${id}`} variant="primary" size="sm">
        {t.createBrand}
      </Button>
    </div>
  );
}
