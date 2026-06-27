-- Operator helper: true when current user has an editor/admin profile role.
create or replace function public.is_operator()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to authenticated, anon;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- Audit columns on brands
alter table public.brands add column if not exists created_by uuid;
alter table public.brands add column if not exists updated_by uuid;

-- ===== brands operator policies =====
drop policy if exists "operators read all brands" on public.brands;
create policy "operators read all brands" on public.brands
  for select using (public.is_operator());

drop policy if exists "operators insert brands" on public.brands;
create policy "operators insert brands" on public.brands
  for insert with check (public.is_operator());

drop policy if exists "operators update brands" on public.brands;
create policy "operators update brands" on public.brands
  for update using (public.is_operator()) with check (public.is_operator());

drop policy if exists "operators delete brands" on public.brands;
create policy "operators delete brands" on public.brands
  for delete using (public.is_operator());

-- ===== brand_assets operator policies =====
drop policy if exists "operators read all assets" on public.brand_assets;
create policy "operators read all assets" on public.brand_assets
  for select using (public.is_operator());

drop policy if exists "operators insert assets" on public.brand_assets;
create policy "operators insert assets" on public.brand_assets
  for insert with check (public.is_operator());

drop policy if exists "operators update assets" on public.brand_assets;
create policy "operators update assets" on public.brand_assets
  for update using (public.is_operator()) with check (public.is_operator());

drop policy if exists "operators delete assets" on public.brand_assets;
create policy "operators delete assets" on public.brand_assets
  for delete using (public.is_operator());

-- ===== brand_colors operator policies =====
drop policy if exists "operators read all colors" on public.brand_colors;
create policy "operators read all colors" on public.brand_colors
  for select using (public.is_operator());

drop policy if exists "operators insert colors" on public.brand_colors;
create policy "operators insert colors" on public.brand_colors
  for insert with check (public.is_operator());

drop policy if exists "operators update colors" on public.brand_colors;
create policy "operators update colors" on public.brand_colors
  for update using (public.is_operator()) with check (public.is_operator());

drop policy if exists "operators delete colors" on public.brand_colors;
create policy "operators delete colors" on public.brand_colors
  for delete using (public.is_operator());

-- ===== timeline_entries operator policies =====
drop policy if exists "operators read all timeline" on public.timeline_entries;
create policy "operators read all timeline" on public.timeline_entries
  for select using (public.is_operator());

drop policy if exists "operators insert timeline" on public.timeline_entries;
create policy "operators insert timeline" on public.timeline_entries
  for insert with check (public.is_operator());

drop policy if exists "operators update timeline" on public.timeline_entries;
create policy "operators update timeline" on public.timeline_entries
  for update using (public.is_operator()) with check (public.is_operator());

drop policy if exists "operators delete timeline" on public.timeline_entries;
create policy "operators delete timeline" on public.timeline_entries
  for delete using (public.is_operator());

-- ===== brand_suggestions operator read + update =====
drop policy if exists "operators read suggestions" on public.brand_suggestions;
create policy "operators read suggestions" on public.brand_suggestions
  for select using (public.is_operator());

drop policy if exists "operators update suggestions" on public.brand_suggestions;
create policy "operators update suggestions" on public.brand_suggestions
  for update using (public.is_operator()) with check (public.is_operator());

-- ===== audit_log =====
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;

drop policy if exists "operators read audit" on public.audit_log;
create policy "operators read audit" on public.audit_log
  for select using (public.is_operator());

drop policy if exists "operators insert audit" on public.audit_log;
create policy "operators insert audit" on public.audit_log
  for insert with check (public.is_operator());

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);