"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { Button } from "@/components/ui";
import {
  setUserRole,
  ASSIGNABLE_ROLES,
  type AssignableRole,
} from "@/app/[locale]/admin/team/actions";

/**
 * TeamRoleControl — per-row role selector + Apply for the Team & Roles screen.
 * Admin-only writes are enforced server-side; this is the inline client UI with
 * a confirm prompt, useTransition pending state, and inline success/failure.
 */
export default function TeamRoleControl({
  locale,
  userId,
  currentRole,
}: {
  locale: Locale;
  userId: string;
  currentRole: AssignableRole;
}) {
  const t = getDictionary(locale).admin.team;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<AssignableRole>(currentRole);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const roleLabel: Record<AssignableRole, string> = {
    user: t.roleUser,
    editor: t.roleEditor,
    admin: t.roleAdmin,
  };

  const changed = selected !== currentRole;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        value={selected}
        disabled={pending}
        onChange={(e) => {
          setSelected(e.target.value as AssignableRole);
          setStatus("idle");
        }}
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-[14px] text-ink"
        aria-label={t.colAction}
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {roleLabel[r]}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={pending || !changed}
        onClick={() => {
          const msg = t.confirm.replace("{role}", roleLabel[selected]);
          if (!window.confirm(msg)) return;
          start(async () => {
            const res = await setUserRole(locale, userId, selected);
            if (res.ok) {
              setStatus("ok");
              router.refresh();
            } else {
              setStatus("error");
            }
          });
        }}
      >
        {pending ? t.applying : t.apply}
      </Button>
      {status === "ok" && (
        <span className="text-[12px] font-medium text-ok">{t.success}</span>
      )}
      {status === "error" && (
        <span className="text-[12px] font-medium text-danger">{t.error}</span>
      )}
    </div>
  );
}
