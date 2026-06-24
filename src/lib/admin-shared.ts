// Pure, client-safe helpers/constants for the operator CMS.
// No server-only imports here so client components can use it.

export type OperatorRole = "editor" | "admin";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const PUBLICATION_STATES = [
  "published",
  "draft",
  "in_review",
  "approved",
  "unpublished",
] as const;
export type PublicationState = (typeof PUBLICATION_STATES)[number];

export const CLAIM_STATUSES = ["unclaimed", "claimed", "verified"] as const;
