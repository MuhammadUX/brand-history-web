import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";

const STYLES: Record<string, string> = {
  published: "bg-verifiedBg text-verifiedText",
  draft: "bg-page text-secondary border border-border",
  in_review: "bg-sponsoredBg text-sponsored",
  approved: "bg-primary-tint text-primary",
  unpublished: "bg-page text-tertiary border border-border",
};

export default function StateBadge({
  state,
  locale,
}: {
  state: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const label =
    (dict.admin.dashboard.states as Record<string, string>)[state] ?? state;
  const cls = STYLES[state] ?? "bg-page text-secondary";
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
