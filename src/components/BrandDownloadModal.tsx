"use client";

import { useState } from "react";
import { Button, ButtonGroup, Modal } from "@/components/ds";
import type { ButtonType } from "@/components/ds";
import { buildLogoSvg } from "@/lib/logo";

interface BrandDownloadModalProps {
  slug: string;
  initials: string;
  color: string;
  name: string;
  /** Trigger label (primary download). */
  label: string;
  pngLabel: string;
  svgLabel: string;
  /** Mono eyebrow / archive code, e.g. "BH-0042". */
  code?: string;
  /** Visual treatment of the trigger. Use `ghost` for in-table rows so the
   *  hero keeps the page's single `primary`. Default `primary`. */
  triggerVariant?: ButtonType;
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
 * BrandDownloadModal — the brand profile's single primary action. Opens the
 * centered DS <Modal> with SVG / PNG export choices. The export logic is lifted
 * verbatim from the legacy DownloadLogoButton (buildLogoSvg + canvas raster),
 * so download behaviour is preserved; only the chrome is re-skinned.
 */
export default function BrandDownloadModal({
  slug,
  initials,
  color,
  name,
  label,
  pngLabel,
  svgLabel,
  code,
  triggerVariant = "primary",
}: BrandDownloadModalProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function downloadSvg() {
    const svg = buildLogoSvg({ initials, color, name });
    triggerDownload(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      `${slug}-logo.svg`,
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
        eyebrow={code ? `[ ${code} ]` : "[ EXPORT ]"}
        title={label}
        footer={
          <ButtonGroup align="end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              CLOSE
            </Button>
            <Button
              variant="secondary"
              onClick={downloadSvg}
              aria-label={`${name} — ${svgLabel}`}
            >
              {svgLabel}
            </Button>
            <Button
              variant="primary"
              onClick={downloadPng}
              disabled={busy}
              aria-label={`${name} — ${pngLabel}`}
            >
              {pngLabel}
            </Button>
          </ButtonGroup>
        }
      >
        <p>
          {name} — specimen mark. Choose a format to extract from the archive.
        </p>
      </Modal>
    </>
  );
}
