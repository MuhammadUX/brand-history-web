"use client";

import Link from "next/link";
import { BrandMark, StateBlock, Button } from "@/components/ui";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import type { DownloadItem } from "@/lib/downloads";

export default function AccountDownloads({
  locale,
  items,
}: {
  locale: Locale;
  items: DownloadItem[];
}) {
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const fmt = new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (items.length === 0) {
    return (
      <StateBlock
        state="empty"
        icon="↓"
        message={dict.account.downloadsEmpty}
        action={
          <Button href={`/${locale}/browse`} variant="primary">
            {dict.account.browseBrands}
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const name = isAr ? it.nameAr : it.nameEn;
        const kindLabel = dict.account.downloadKinds[it.kind] ?? it.kind;
        const date = fmt.format(new Date(it.createdAt));
        return (
          <li key={it.id}>
            <Link
              href={`/${locale}/brand/${it.slug}`}
              className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2"
            >
              <BrandMark
                domain={it.website}
                initials={it.initials}
                color={it.primaryColor}
                size="sm"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink">
                  {name}
                </span>
                <span className="block text-[12px] text-muted">
                  {kindLabel} · {date}
                </span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-link">
                {dict.account.openBrand} →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
