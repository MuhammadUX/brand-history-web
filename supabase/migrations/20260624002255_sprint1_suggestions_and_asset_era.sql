-- brand_suggestions table
create table if not exists public.brand_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  region text,
  url text,
  email text,
  locale text default 'en',
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.brand_suggestions enable row level security;

drop policy if exists "anon can insert suggestions" on public.brand_suggestions;
create policy "anon can insert suggestions"
  on public.brand_suggestions
  for insert
  to anon
  with check (true);

-- add era column to brand_assets (for archive grouping)
alter table public.brand_assets add column if not exists era text;