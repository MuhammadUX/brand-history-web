"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import { buildLogoSvg } from "@/lib/logo";
import { recordDownload } from "@/app/[locale]/brand/[slug]/download-actions";

interface BrandDownloadButtonProps {
  slug: string;
  /** Brand id — used to record the download in the user's history. */
  brandId: string;
  initials: string;
  color: string;
  name: string;
  /** Trigger label (primary download). */
  label: string;
  pngLabel: string;
  svgLabel: string;
  /** Visual treatment of the trigger. Default "primary". */
  triggerVariant?: "primary" | "ghost";
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
 * BrandDownloadButton — The Library asset download control. Opens a centered
 * Modal with SVG / PNG export choices. The export logic (buildLogoSvg + canvas
 * raster) is preserved verbatim from the prior implementation; only the chrome
 * is re-skinned to Library primitives.
 */
export default function BrandDownloadButton({
  slug,
  brandId,
  initials,
  color,
  name,
  label,
  pngLabel,
  svgLabel,
  triggerVariant = "primary",
}: BrandDownloadButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function downloadSvg() {
    const svg = buildLogoSvg({ initials, color, name });
    triggerDownload(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      `${slug}-logo.svg`,
    );
    // Record for the user's download history (best-effort, anon = no-op).
    void recordDownload(brandId, "logo-svg");
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
        void recordDownload(brandId, "logo-png");
      }
    } catch {
      // fall back silently; SVG remains available
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerVariant === "ghost" ? "sm" : "md"}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Export"
        title={label}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {svgLabel === pngLabel ? "Close" : "Close"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSvg}
              aria-label={`${name} — ${svgLabel}`}
            >
              {svgLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={downloadPng}
              disabled={busy}
              aria-label={`${name} — ${pngLabel}`}
            >
              {pngLabel}
            </Button>
          </div>
        }
      >
        <p className="text-[14px] text-muted">
          {name} — choose a format to download.
        </p>
      </Modal>
    </>
  );
}
