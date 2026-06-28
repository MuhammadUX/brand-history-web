-- Brand assets gain a stored image file URL. Previously brand_assets recorded
-- only asset_type + names + formats[] with no actual image; operators can now
-- upload the real logo/asset file (stored in the `brand-assets` Storage bucket)
-- and we keep its public URL here. formats[] still records the extension(s).
-- Idempotent.
alter table public.brand_assets add column if not exists image_url text;
