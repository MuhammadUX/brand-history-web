"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

const LS_KEY = "bh_favorites";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr.filter((x) => typeof x === "string") as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* ignore quota / disabled storage */
  }
}

interface FavoriteButtonProps {
  brandId: string;
  brandName: string;
  locale: Locale;
  /** Server-known initial favorite state (logged-in users). */
  initialFavorited?: boolean;
  /** When true the user is authenticated (avoids a client auth roundtrip on render). */
  initialAuthed?: boolean;
  /** Visual style. "icon" = compact heart for cards; "button" = labeled. */
  variant?: "icon" | "button";
  /** Notify parent (e.g. account list) after a successful remove. */
  onRemoved?: () => void;
}

export default function FavoriteButton({
  brandId,
  brandName,
  locale,
  initialFavorited = false,
  initialAuthed = false,
  variant = "icon",
  onRemoved,
}: FavoriteButtonProps) {
  const dict = getDictionary(locale);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [authed, setAuthed] = useState(initialAuthed);
  const [resolved, setResolved] = useState(initialAuthed);
  const [busy, setBusy] = useState(false);
  const [showDeviceNote, setShowDeviceNote] = useState(false);

  // Resolve auth + initial state on the client (covers anonymous users and
  // SSR that didn't pass an initial state).
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      if (user) {
        setAuthed(true);
        setResolved(true);
        // Trust SSR initialFavorited when provided; otherwise leave as-is.
      } else {
        setAuthed(false);
        setResolved(true);
        setFavorited(readLocal().includes(brandId));
      }
    });
    return () => {
      active = false;
    };
  }, [brandId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !favorited;
    setFavorited(next); // optimistic

    try {
      if (authed) {
        const supabase = createClient();
        if (next) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("no-user");
          const { error } = await supabase
            .from("favorites")
            .upsert(
              { user_id: user.id, brand_id: brandId },
              { onConflict: "user_id,brand_id", ignoreDuplicates: true }
            );
          if (error) throw error;
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("no-user");
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("brand_id", brandId);
          if (error) throw error;
          onRemoved?.();
        }
      } else {
        // Anonymous → localStorage
        const current = readLocal();
        const updated = next
          ? [...current, brandId]
          : current.filter((id) => id !== brandId);
        writeLocal(updated);
        setShowDeviceNote(next);
      }
    } catch {
      setFavorited(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  const isFav = favorited;
  const ariaLabel = isFav
    ? dict.favorite.removeAria(brandName)
    : dict.favorite.saveAria(brandName);

  if (variant === "button") {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={busy || !resolved}
          aria-pressed={isFav}
          aria-label={ariaLabel}
          className={`inline-flex items-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            isFav
              ? "border-primary bg-primary-tint text-primary"
              : "border-border bg-surface text-ink hover:border-primary/40"
          }`}
        >
          <HeartIcon filled={isFav} />
          {isFav ? dict.favorite.saved : dict.favorite.save}
        </button>
        {showDeviceNote && !authed && (
          <p className="text-xs text-tertiary">{dict.favorite.deviceNote}</p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Prevent navigation when placed inside a card link.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={busy || !resolved}
      aria-pressed={isFav}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isFav
          ? "border-primary bg-primary-tint text-primary"
          : "border-border bg-surface text-secondary hover:border-primary/40 hover:text-primary"
      }`}
    >
      <HeartIcon filled={isFav} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
