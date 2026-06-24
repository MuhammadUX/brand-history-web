# Brand History — Web (Sprint 0 vertical slice)

A bilingual (EN/AR, RTL) public brand-asset reference library. This is the **Sprint-0 walking skeleton**: Next.js 15 (App Router) + TypeScript + Tailwind v3, reading live data from a Supabase Postgres database.

## What works
- **Home** (`/en`, `/ar`) — hero + global search + sectors row + Discover grid of all published brands.
- **Search** (`/en/search?q=`) — server-side ILIKE search on Arabic + English names, result count, empty state.
- **Brand profile** (`/en/brand/[slug]`) — placeholder logo (initials on brand colour), bilingual names, sector·region·founded, Verified/Curated badge, Download / Copy-colour / Pro-locked kit, and Assets / Guidelines (colours) / Timeline sections — all from the DB.
- Bilingual EN/AR with `dir="rtl"` for Arabic; design-system tokens wired into the Tailwind theme.

## Architecture (this slice)
- **DB:** Supabase Postgres (`brand-history-dev`), RLS = anonymous can `SELECT` only `publication_state='published'` rows. Tables: `sectors, brands, brand_assets, brand_colors, timeline_entries`.
- **App:** Server Components fetch via the Supabase anon (publishable) key — no service role. Data pages are `force-dynamic` (per-request fetch).
- **Provider boundaries** keep this dev stack swappable for the production target (GCP Dammam + the planned services) — see `01 - Mandatory/Development-Plan.md`.

> ⚠️ **Residency note:** Supabase (eu-central-1) and Vercel are the **dev/prototype** environment. Production personal data must move to the in-Kingdom GCP Dammam target per the PDPL decision (Decision-Register.md). The anon key here is publishable-by-design and RLS-protected.

## Run locally
```bash
cd brand-history-app
cp .env.example .env.local   # values already default in-source; env optional
npm install
npm run dev                  # http://localhost:3000  → redirects to /en
```

## Deploy
See `DEPLOY.md` — one command (`npx vercel --prod`) or connect the folder as a GitHub repo to Vercel. No env config required (publishable keys are in-source fallbacks; override via env for prod).

## Env
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional; in-source fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key (optional; in-source fallback) |
