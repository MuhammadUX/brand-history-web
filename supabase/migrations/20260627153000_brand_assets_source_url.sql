-- Captures another out-of-band production change: brand_assets.source_url
-- (queried by getBrandAssets/getArchivedAssets but missing from the recorded
-- migration history, so a clean replay lacked it). Idempotent.
alter table public.brand_assets add column if not exists source_url text;
