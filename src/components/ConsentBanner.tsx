"use client";

import { useEffect, useState } from "react";
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto max-w-container px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-ink">{dict.consent.title}</h2>
            <p className="mt-1 text-sm text-secondary">{dict.consent.body}</p>
            <p className="mt-1 text-xs text-tertiary">{dict.consent.policyNote}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <button
              type="button"
              onClick={rejectNonEssential}
              className="rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.consent.rejectNonEssential}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.consent.manage}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.consent.acceptAll}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 border-t border-border pt-5">
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
              <button
                type="button"
                onClick={saveChoices}
                className="rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {dict.consent.save}
              </button>
            </div>
          </div>
        )}
      </div>
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
    <label
      className={`flex items-start justify-between gap-3 rounded-card border border-border bg-page p-4 ${
        disabled ? "opacity-90" : "cursor-pointer"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-secondary">{desc}</span>
      </span>
      {disabled ? (
        <span className="shrink-0 rounded-pill bg-verifiedBg px-2.5 py-0.5 text-xs font-semibold text-verifiedText">
          {alwaysOnLabel}
        </span>
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
      )}
    </label>
  );
}
