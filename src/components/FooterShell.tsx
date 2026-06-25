"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/ds";
import type { FooterProps } from "@/components/ds/Footer";

/**
 * FooterShell — client wrapper around the DS <Footer>. Suppresses the public
 * colophon on operator/admin routes (which render their own OperatorSidebar
 * chrome), so admin pages don't get the public footer on top of the rail.
 */
export default function FooterShell(props: FooterProps) {
  const pathname = usePathname() || "";
  if (/(^|\/)admin(\/|$)/.test(pathname)) {
    return null;
  }
  return <Footer {...props} />;
}
