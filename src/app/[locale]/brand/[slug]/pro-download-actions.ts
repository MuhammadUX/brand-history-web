"use server";

import { getEntitlements } from "@/lib/entitlements";
import { getBrandById, getBrandColors } from "@/lib/data";
import { buildLogoSvg } from "@/lib/logo";
import { recordDownload } from "./download-actions";

export type ProDownloadKind = "highres" | "kit";

export interface ProDownloadColor {
  name: string;
  hex: string;
  role: string;
}

export interface ProDownloadPayload {
  slug: string;
  name: string;
  /** High-res (1024px) logo SVG, rasterized to PNG on the client. */
  highResSvg: string;
  /** Primary + monochrome 512px logo SVG variants for the kit bundle. */
  primarySvg: string;
  monoSvg: string;
  primaryColor: string;
  colors: ProDownloadColor[];
}

export type ProDownloadResult =
  | { ok: true; payload: ProDownloadPayload }
  | { ok: false; error: "pro_required" | "not_found" };

/**
 * Server-enforced Pro download. Authorization is decided here (never by a
 * client `isPro` prop): we read the session-scoped entitlements and only return
 * a build payload when the user is genuinely Pro. Free/anonymous users get
 * `{ ok: false, error: "pro_required" }` and the client routes them to /pro.
 */
export async function requestProDownload(
  brandId: string,
  kind: ProDownloadKind
): Promise<ProDownloadResult> {
  // Server-side entitlement check (resolves to all-false for free/anon/expired).
  const entitlements = await getEntitlements();
  const isPro = entitlements.high_res && entitlements.bulk_zip;
  if (!isPro) return { ok: false, error: "pro_required" };

  const brand = await getBrandById(brandId);
  if (!brand) return { ok: false, error: "not_found" };

  const colorRows = await getBrandColors(brand.id);
  const name = brand.name_en || brand.name_ar;

  const highResSvg = buildLogoSvg({
    initials: brand.initials,
    color: brand.primary_color,
    name,
    size: 1024,
  });
  const primarySvg = buildLogoSvg({
    initials: brand.initials,
    color: brand.primary_color,
    name,
    size: 512,
  });
  const monoSvg = buildLogoSvg({
    initials: brand.initials,
    color: "#16181D",
    name,
    size: 512,
  });

  // Record the download for the user's history (best-effort).
  await recordDownload(brand.id, kind === "kit" ? "kit" : "highres");

  return {
    ok: true,
    payload: {
      slug: brand.slug,
      name,
      highResSvg,
      primarySvg,
      monoSvg,
      primaryColor: brand.primary_color,
      colors: colorRows.map((c) => ({
        name: c.name,
        hex: c.hex,
        role: c.role,
      })),
    },
  };
}
