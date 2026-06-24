"use client";

import { useState } from "react";
import Link from "next/link";
import { buildLogoSvg } from "@/lib/logo";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

interface KitColor {
  name: string;
  hex: string;
  role: string;
}

interface BrandKitButtonProps {
  locale: Locale;
  slug: string;
  initials: string;
  color: string;
  name: string;
  colors: KitColor[];
  /** Server-decided. When false, render a PRO lock that opens the paywall. */
  isPro: boolean;
  kind: "kit" | "highres";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Pro-gated downloads on the brand profile.
 *  - kind="highres": 1024px PNG export of the logo.
 *  - kind="kit": a combined multi-variant SVG bundle + a colors.txt, delivered
 *    as a sequence of file downloads (no zip dependency). Reuses the Sprint-1
 *    buildLogoSvg util for the placeholder logos.
 * Free users get a PRO lock linking to /pro instead of the action.
 */
export default function BrandKitButton({
  locale,
  slug,
  initials,
  color,
  name,
  colors,
  isPro,
  kind,
}: BrandKitButtonProps) {
  const dict = getDictionary(locale);
  const [busy, setBusy] = useState(false);

  if (!isPro) {
    const label = kind === "kit" ? dict.brand.downloadKit : dict.brand.downloadHighRes;
    return (
      <Link
        href={`/${locale}/pro`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-btn border border-border bg-page px-5 py-2.5 text-sm font-medium text-tertiary transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="rounded-pill bg-sponsoredBg px-2 py-0.5 text-xs font-semibold text-sponsored">
          {dict.brand.proLock}
        </span>
        {label}
      </Link>
    );
  }

  async function downloadHighRes() {
    setBusy(true);
    try {
      const size = 1024;
      const svg = buildLogoSvg({ initials, color, name, size });
      const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg load failed"));
        img.src = svgUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) triggerDownload(blob, `${slug}-logo-1024.png`);
            resolve();
          }, "image/png");
        });
      }
    } finally {
      setBusy(false);
    }
  }

  function buildVariantSvg(variant: "primary" | "mono"): string {
    const c = variant === "mono" ? "#16181D" : color;
    return buildLogoSvg({ initials, color: c, name, size: 512 });
  }

  async function downloadKit() {
    setBusy(true);
    try {
      // Combined SVG bundle: primary + monochrome placeholder logos.
      const bundle = `<!-- ${name} brand kit (placeholder logos) -->\n${buildVariantSvg(
        "primary"
      )}\n\n${buildVariantSvg("mono")}\n`;
      triggerDownload(
        new Blob([bundle], { type: "image/svg+xml;charset=utf-8" }),
        `${slug}-brand-kit.svg`
      );

      // colors.txt — the brand palette.
      const colorsTxt =
        `${name} — brand colors\n` +
        `Primary: ${color}\n` +
        colors
          .map((col) => `${col.name} (${col.role}): ${col.hex.toUpperCase()}`)
          .join("\n") +
        "\n";
      // Slight delay so browsers don't drop the second download.
      await new Promise((r) => setTimeout(r, 250));
      triggerDownload(
        new Blob([colorsTxt], { type: "text/plain;charset=utf-8" }),
        `${slug}-colors.txt`
      );
    } finally {
      setBusy(false);
    }
  }

  const onClick = kind === "kit" ? downloadKit : downloadHighRes;
  const label =
    busy && kind === "kit"
      ? dict.brand.kitDownloading
      : kind === "kit"
        ? dict.brand.downloadKit
        : dict.brand.downloadHighRes;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-btn border border-primary bg-primary-tint px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <span className="rounded-pill bg-primary px-2 py-0.5 text-xs font-bold text-white">
        {dict.nav.proBadge}
      </span>
      {label}
    </button>
  );
}
