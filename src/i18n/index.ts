import en, { type Dictionary } from "./en";
import ar from "./ar";
import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["en", "ar"];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return locale === "ar" ? ar : en;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export type { Dictionary };
