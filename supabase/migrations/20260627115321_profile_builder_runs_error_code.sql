alter table public.profile_builder_runs
  add column if not exists error_code text;