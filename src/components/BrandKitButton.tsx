"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import {
  requestProDownload,
  type ProDownloadPayload,
} from "@/app/[locale]/brand/[slug]/pro-download-actions";

interface KitColor {
  name: string;
  hex: string;
  role: string;
}

interface BrandKitButtonProps {
  locale: Locale;
  brandId: string;
  slug: string;
  initials: string;
  color: string;
  name: string;
  colors: KitColor[];
  /** Client hint for the lock UI only. Authorization is the server action. */
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
 *  - kind="kit": a combined multi-variant SVG bundle + a colors.txt.
 *
 * Authorization is SERVER-ENFORCED: the click calls requestProDownload(), which
 * checks entitlements server-side. The download is built ONLY from the server's
 * `ok:true` payload. The client `isPro` prop only drives the lock UI; on
 * `pro_required` we route to /pro.
 */
export default function BrandKitButton({
  locale,
  brandId,
  isPro,
  kind,
}: BrandKitButtonProps) {
  const dict = getDictionary(locale);
  const router = useRouter();
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

  async function buildHighRes(payload: ProDownloadPayload) {
    const size = 1024;
    const svgUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(payload.highResSvg);
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
          if (blob) triggerDownload(blob, `${payload.slug}-logo-1024.png`);
          resolve();
        }, "image/png");
      });
    }
  }

  async function buildKit(payload: ProDownloadPayload) {
    // Combined SVG bundle: primary + monochrome placeholder logos.
    const bundle = `<!-- ${payload.name} brand kit (placeholder logos) -->\n${payload.primarySvg}\n\n${payload.monoSvg}\n`;
    triggerDownload(
      new Blob([bundle], { type: "image/svg+xml;charset=utf-8" }),
      `${payload.slug}-brand-kit.svg`
    );

    // colors.txt — the brand palette.
    const colorsTxt =
      `${payload.name} — brand colors\n` +
      `Primary: ${payload.primaryColor}\n` +
      payload.colors
        .map((col) => `${col.name} (${col.role}): ${col.hex.toUpperCase()}`)
        .join("\n") +
      "\n";
    // Slight delay so browsers don't drop the second download.
    await new Promise((r) => setTimeout(r, 250));
    triggerDownload(
      new Blob([colorsTxt], { type: "text/plain;charset=utf-8" }),
      `${payload.slug}-colors.txt`
    );
  }

  async function onClick() {
    setBusy(true);
    try {
      const res = await requestProDownload(brandId, kind);
      if (!res.ok) {
        if (res.error === "pro_required") {
          router.push(`/${locale}/pro`);
        }
        return;
      }
      if (kind === "kit") {
        await buildKit(res.payload);
      } else {
        await buildHighRes(res.payload);
      }
    } finally {
      setBusy(false);
    }
  }

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
