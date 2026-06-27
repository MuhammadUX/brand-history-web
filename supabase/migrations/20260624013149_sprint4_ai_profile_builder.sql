-- Sprint 4: AI Profile Builder
-- 1) profile_builder_runs table
create table if not exists public.profile_builder_runs (
  id uuid primary key default gen_random_uuid(),
  input_name text not null,
  hints jsonb not null default '{}'::jsonb,
  languages text[] not null default '{en,ar}',
  status text not null default 'gathering'
    check (status in ('gathering','draft_ready','accepted','discarded','failed')),
  draft jsonb,
  brand_id uuid references public.brands(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_builder_runs enable row level security;

-- RLS: operators (editor/admin) may select/insert/update.
drop policy if exists pbr_select_operator on public.profile_builder_runs;
create policy pbr_select_operator on public.profile_builder_runs
  for select using (is_operator());

drop policy if exists pbr_insert_operator on public.profile_builder_runs;
create policy pbr_insert_operator on public.profile_builder_runs
  for insert with check (is_operator());

drop policy if exists pbr_update_operator on public.profile_builder_runs;
create policy pbr_update_operator on public.profile_builder_runs
  for update using (is_operator()) with check (is_operator());

create index if not exists profile_builder_runs_status_idx
  on public.profile_builder_runs (status, created_at desc);

-- 2) brands provenance columns
alter table public.brands
  add column if not exists source text not null default 'manual'
    check (source in ('ai','manual'));
alter table public.brands
  add column if not exists ai_run_id uuid;
