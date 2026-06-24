"use client";

import { useState } from "react";
import { buildLogoSvg } from "@/lib/logo";

interface DownloadLogoButtonProps {
  slug: string;
  initials: string;
  color: string;
  name: string;
  label: string;
  pngLabel: string;
  className?: string;
  /** When true, renders a smaller secondary style for asset cards. */
  compact?: boolean;
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

export default function DownloadLogoButton({
  slug,
  initials,
  color,
  name,
  label,
  pngLabel,
  className,
  compact = false,
}: DownloadLogoButtonProps) {
  const [busy, setBusy] = useState(false);

  function downloadSvg() {
    const svg = buildLogoSvg({ initials, color, name });
    triggerDownload(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      `${slug}-logo.svg`
    );
  }

  async function downloadPng() {
    setBusy(true);
    try {
      const size = 512;
      const svg = buildLogoSvg({ initials, color, name, size });
      const svgUrl =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
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
            if (blob) triggerDownload(blob, `${slug}-logo.png`);
            resolve();
          }, "image/png");
        });
      }
    } catch {
      // Fall back to SVG only if PNG rendering fails.
    } finally {
      setBusy(false);
    }
  }

  const baseBtn = compact
    ? "inline-flex items-center justify-center rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    : "inline-flex items-center justify-center rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={downloadSvg}
        aria-label={`${name} — ${label}`}
        className={className ?? baseBtn}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy}
        aria-label={`${name} — ${pngLabel}`}
        className="inline-flex items-center justify-center rounded-btn border border-border bg-surface px-3 py-2 text-xs font-medium text-secondary transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pngLabel}
      </button>
    </span>
  );
}
