import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Badge } from "@/components/ui";

/**
 * StateBadge — wraps the Library <Badge kind="state"> and maps each publication
 * state (draft/in_review/approved/published/unpublished) to a localized label
 * and a tone. The Library state badge is a neutral hairline pill; published &
 * approved get a tinted, do-aligned tone to read at a glance, archived/inactive
 * states stay muted. Honest, calm, RTL-safe.
 */
const TONES: Record<string, string> = {
  // Live → verified/do green tint.
  published: "text-ok border-[#bfe6cd] bg-[#eef9f1]",
  // Approved → governed gold, "ready".
  approved: "text-link border-line bg-surface-2",
  // In review → amber "in flight".
  in_review: "text-amber border-amber-line bg-amber-bg",
  // Draft / unpublished → neutral muted hairline.
  draft: "text-muted border-line bg-surface-2",
  unpublished: "text-muted border-line bg-surface-2",
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
  return (
    <Badge kind="state" className={TONES[state]}>
      {label}
    </Badge>
  );
}
