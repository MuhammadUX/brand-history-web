/**
 * Pro pricing constants (single source of truth).
 * Annual is ~20% off the monthly run-rate (19 * 12 = 228 → 182).
 */
export type Plan = "monthly" | "annual";

export const PRICING: Record<Plan, { amountSar: number; period: string }> = {
  monthly: { amountSar: 19, period: "month" },
  annual: { amountSar: 182, period: "year" },
};

/** ~20% saving vs. paying monthly for a year. */
export const ANNUAL_SAVING_PERCENT = 20;

export function isPlan(value: string | null | undefined): value is Plan {
  return value === "monthly" || value === "annual";
}

export function amountForPlan(plan: Plan): number {
  return PRICING[plan].amountSar;
}

/** All entitlements granted when a subscription becomes active. */
export const FULL_ENTITLEMENTS = {
  ad_free: true,
  bulk_zip: true,
  high_res: true,
  api: true,
  advanced_search: true,
} as const;

export const NO_ENTITLEMENTS = {
  ad_free: false,
  bulk_zip: false,
  high_res: false,
  api: false,
  advanced_search: false,
} as const;
