"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import {
  requestProDownload,
  type ProDownloadPayload,
  type ProDownloadKind,
} from "@/app/[locale]/brand/[slug]/pro-download-actions";

interface ProDownloadButtonProps {
  locale: Locale;
  brandId: string;
  /** Client hint for the lock UI only. Authorization is the server action. */
  isPro: boolean;
  kind: ProDownloadKind;
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
 * ProDownloadButton — The Library Pro-gated download. Authorization is
 * SERVER-ENFORCED via requestProDownload(); the client `isPro` prop only drives
 * the lock UI. Logic (server action + canvas/blob builders) is preserved from
 * the prior BrandKitButton; re-skinned to Library primitives.
 *  - kind="highres": 1024px PNG export of the logo.
 *  - kind="kit": a combined multi-variant SVG bundle + a colors.txt.
 */
export default function ProDownloadButton({
  locale,
  brandId,
  isPro,
  kind,
}: ProDownloadButtonProps) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
    const bundle = `<!-- ${payload.name} brand kit (placeholder logos) -->\n${payload.primarySvg}\n\n${payload.monoSvg}\n`;
    triggerDownload(
      new Blob([bundle], { type: "image/svg+xml;charset=utf-8" }),
      `${payload.slug}-brand-kit.svg`,
    );
    const colorsTxt =
      `${payload.name} — brand colors\n` +
      `Primary: ${payload.primaryColor}\n` +
      payload.colors
        .map((col) => `${col.name} (${col.role}): ${col.hex.toUpperCase()}`)
        .join("\n") +
      "\n";
    await new Promise((r) => setTimeout(r, 250));
    triggerDownload(
      new Blob([colorsTxt], { type: "text/plain;charset=utf-8" }),
      `${payload.slug}-colors.txt`,
    );
  }

  async function onClick() {
    setBusy(true);
    try {
      const res = await requestProDownload(brandId, kind);
      if (!res.ok) {
        if (res.error === "pro_required") router.push(`/${locale}/pro`);
        return;
      }
      if (kind === "kit") await buildKit(res.payload);
      else await buildHighRes(res.payload);
    } finally {
      setBusy(false);
    }
  }

  const label =
    kind === "kit" ? dict.brand.downloadKit : dict.brand.downloadHighRes;

  if (!isPro) {
    return (
      <Button href={`/${locale}/pro`} variant="ghost" size="sm">
        <Badge kind="pro">{dict.brand.proLock}</Badge>
        {label}
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={busy}>
      <Badge kind="pro">{dict.nav.proBadge}</Badge>
      {busy && kind === "kit" ? dict.brand.kitDownloading : label}
    </Button>
  );
}
