-- Store the raw provider error/response detail so the failed AI-builder screen
-- can show operators exactly what the model returned (e.g. truncated/unparseable
-- JSON), not just a generic message. Nullable, free text.
alter table public.profile_builder_runs add column if not exists error_detail text;
