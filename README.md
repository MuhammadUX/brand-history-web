# Brand History — Web

A bilingual (EN/AR, RTL) public brand-asset reference library plus an operator
back-office and a Pro subscription tier. **Next.js 15 (App Router) + TypeScript +
Tailwind v3**, reading live data from a Supabase Postgres database via the anon
(publishable) key — RLS-protected, no service role in the app.

Built across Sprints 0–6. This README reflects the Sprint-6 (final) build.

## Demo accounts
| Email | Password | Role |
|---|---|---|
| `demo@brandhistory.test` | `Demo#12345` | Editor (operator) + the seeded demo user (favorites, notifications, DSAR) |
| `admin@brandhistory.test` | `Admin#12345` | Admin (operator; publish/unpublish, full console) |

Both accounts are pre-confirmed (email delivery is stubbed — see Mocks below).

## Routes
Public (bilingual, under `/[locale]` where locale ∈ `en`,`ar`):
- `/` → redirects to `/en`
- `/[locale]` — Home: hero, global search, sectors, Discover grid
- `/[locale]/search?q=&sector=` — server-side ILIKE search (EN+AR names)
- `/[locale]/browse?sector=` — A–Z browse of published brands
- `/[locale]/discover` — brand-of-week, trending, recently updated (+ AdSlot)
- `/[locale]/brand/[slug]` — brand profile (assets, colors, timeline, archive)
- `/[locale]/brand/[slug]/compare` — era comparison
- `/[locale]/brand/[slug]/opengraph-image` — dynamic OG card (initials on primary color)
- `/[locale]/pro` — Pro marketing + pricing toggle
- `/[locale]/checkout` — mock checkout (stc pay / mada / Visa / Mastercard)
- `/[locale]/suggest` — public "suggest a brand" form
- `/[locale]/maintenance` — branded bilingual maintenance page (noindex)
- `/[locale]/unavailable` — friendly "no longer available" page for taken-down brands
- SEO: `/sitemap.xml` (locales + published brand URLs), `/robots.txt`

Auth:
- `/[locale]/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`

Account (auth-gated):
- `/[locale]/account` — tabs: Profile · Subscription · Favorites · Downloads · **Data & privacy** (DSAR export + delete request)
- `/[locale]/notifications` — read/unread list, mark read / mark all read

Operator console (`/[locale]/admin/*`, editor/admin only):
- `/admin` — dashboard (pipeline overview, pending requests, recent activity)
- `/admin/brands`, `/admin/brands/new`, `/admin/brands/[id]` — pipeline + editor (state machine, publish gate)
- `/admin/ai-builder`, `/admin/ai-builder/[runId]` — AI Profile Builder (drafts only; STUB)
- `/admin/requests` — public brand suggestions
- `/admin/audit` — operator audit log

## Data model (Supabase Postgres, RLS on every table)
`sectors, brands, brand_assets, brand_colors, timeline_entries, brand_suggestions,
profiles, favorites, audit_log, profile_builder_runs, subscriptions, payment_events,
consent_records, dsar_requests, notifications`.

Anonymous reads are restricted by RLS to `brands.publication_state='published'`
(and child rows of published brands). Operators use `is_operator()` / `is_admin()`
SECURITY DEFINER helpers. Privacy: `consent_records` (anon+auth insert; owner read),
`dsar_requests` (owner select/insert; operator select), `notifications` (owner
select/update; operator-or-self insert).

## Architecture
- **Server Components** fetch via the Supabase anon key (`src/lib/supabase.ts`);
  cookie-session auth via `@supabase/ssr` (`src/lib/supabase-server.ts`, `-browser.ts`).
- Data pages are `force-dynamic`. Fonts loaded via runtime `<link>` (no build-time fetch).
- Provider boundaries keep the dev stack swappable for the production target.

## Mocks / dev stubs and their production swap points
| Concern | Dev stub | Swap point |
|---|---|---|
| **LLM** (AI Profile Builder) | `src/lib/ai/llm-provider.ts` — deterministic, no network; drafts only, never auto-publishes | Implement `LlmProvider` with Claude/GPT/Gemini keys; same interface, no call-site change |
| **Payments** (Pro) | `src/lib/payments/payment-provider.ts` — `MockPaymentProvider` (always succeeds unless `_declined`) | Implement `PaymentProvider` for **stc pay** + **Moyasar** (mada/card 3DS); selected via `PAYMENT_PROVIDER` env |
| **Email** (verify, reset, notifications) | No sender wired; demo accounts pre-confirmed; in-app notifications used instead | Add an `EmailProvider` (e.g. **Postmark**) called from auth + notification flows |
| **Consent log / DSAR** | DB rows written (`consent_records`, `dsar_requests`); account deletion is recorded but **not executed** in the demo | Wire an erasure worker to process `dsar_requests` (30-day SLA); enable Google/Apple SSO |
| **OG image** | `next/og` ImageResponse using system fonts only (no network) | Optionally add brand artwork / custom fonts |

## Run locally
```bash
cd brand-history-app
cp .env.example .env.local   # values default in-source; env optional
npm install
npm run dev                  # http://localhost:3000 → redirects to /en
```

## Env
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional; in-source fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key (optional; in-source fallback) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for SEO (sitemap, canonical, OG). Defaults to a placeholder |
| `PAYMENT_PROVIDER` | Selects the payment provider impl (`mock` in dev) |

> ⚠️ **Residency note:** Supabase (eu-central-1) + Vercel are the **dev/prototype**
> environment. Production personal data must move to the in-Kingdom **GCP Dammam**
> target per the PDPL decision. The anon key here is publishable-by-design and RLS-protected.

## Deploy
See `DEPLOY.md` — `npx vercel --prod` or connect the folder to Vercel. No env
config required for the demo (publishable keys are in-source fallbacks).
