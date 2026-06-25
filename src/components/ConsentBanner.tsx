"use client";

import { useEffect, useState } from "react";
import { Button, Toggle, Badge } from "@/components/ui";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { recordConsent, type ConsentChoices } from "@/app/[locale]/consent-actions";

const COOKIE = "bh_consent";
const ANON_KEY = "bh_anon_id";
/** Custom event the footer "Privacy choices" link dispatches to reopen the banner. */
export const OPEN_CONSENT_EVENT = "bh:open-consent";

function hasConsentCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));
}

function setConsentCookie(choices: ConsentChoices) {
  const oneYear = 60 * 60 * 24 * 365;
  const value = encodeURIComponent(JSON.stringify(choices));
  document.cookie = `${COOKIE}=${value}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
}

function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

/**
 * ConsentBanner — The Library PDPL/GDPR consent control (client). Same cookie /
 * server-log / granular-toggle logic as before; re-skinned to Library tokens:
 * a soft floating card, never pre-ticked.
 */
export default function ConsentBanner({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Granular toggles — all OFF by default (no pre-ticked boxes).
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [personalization, setPersonalization] = useState(false);

  useEffect(() => {
    if (!hasConsentCookie()) setOpen(true);
    function reopen() {
      setExpanded(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function commit(choices: ConsentChoices) {
    setConsentCookie(choices);
    // Best-effort server log; never blocks the UI.
    recordConsent(choices, getAnonId()).catch(() => {});
    setOpen(false);
  }

  function acceptAll() {
    setAnalytics(true);
    setAds(true);
    setPersonalization(true);
    commit({ essential: true, analytics: true, ads: true, personalization: true });
  }
  function rejectNonEssential() {
    commit({ essential: true, analytics: false, ads: false, personalization: false });
  }
  function saveChoices() {
    commit({ essential: true, analytics, ads, personalization });
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={dict.consent.title}
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-[640px] rounded-lg border border-line bg-surface p-5 shadow-pop"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-[18px] font-bold leading-tight text-ink">
            {dict.consent.title}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-ink">{dict.consent.body}</p>
          <p className="mt-1 text-[11px] text-muted">{dict.consent.policyNote}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={rejectNonEssential}>
            {dict.consent.rejectNonEssential}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {dict.consent.manage}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={acceptAll}>
            {dict.consent.acceptAll}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow
              label={dict.consent.essential}
              desc={dict.consent.essentialDesc}
              checked
              disabled
              alwaysOnLabel={dict.consent.alwaysOn}
              onChange={() => {}}
            />
            <ToggleRow
              label={dict.consent.analytics}
              desc={dict.consent.analyticsDesc}
              checked={analytics}
              onChange={setAnalytics}
            />
            <ToggleRow
              label={dict.consent.ads}
              desc={dict.consent.adsDesc}
              checked={ads}
              onChange={setAds}
            />
            <ToggleRow
              label={dict.consent.personalization}
              desc={dict.consent.personalizationDesc}
              checked={personalization}
              onChange={setPersonalization}
            />
          </div>
          <div className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={saveChoices}>
              {dict.consent.save}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  disabled = false,
  alwaysOnLabel,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  alwaysOnLabel?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface-2 p-4">
      <span>
        <span className="block text-[15px] font-semibold leading-tight text-ink">
          {label}
        </span>
        <span className="mt-1 block text-[11px] text-muted">{desc}</span>
      </span>
      {disabled ? (
        <span className="shrink-0">
          <Badge kind="neutral">{alwaysOnLabel}</Badge>
        </span>
      ) : (
        <Toggle checked={checked} onChange={onChange} aria-label={label} />
      )}
    </div>
  );
}
