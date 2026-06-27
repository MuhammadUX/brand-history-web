
-- 1. consent_records
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anon_id text,
  choices jsonb not null,
  policy_version text not null default 'v1',
  created_at timestamptz default now()
);
alter table public.consent_records enable row level security;

drop policy if exists "anyone can insert consent" on public.consent_records;
create policy "anyone can insert consent"
  on public.consent_records for insert
  to anon, authenticated
  with check (true);

drop policy if exists "users read own consent" on public.consent_records;
create policy "users read own consent"
  on public.consent_records for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. dsar_requests
create table if not exists public.dsar_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('export','delete')),
  status text default 'received' check (status in ('received','processing','completed','rejected')),
  created_at timestamptz default now()
);
alter table public.dsar_requests enable row level security;

drop policy if exists "users select own dsar" on public.dsar_requests;
create policy "users select own dsar"
  on public.dsar_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own dsar" on public.dsar_requests;
create policy "users insert own dsar"
  on public.dsar_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "operators read dsar" on public.dsar_requests;
create policy "operators read dsar"
  on public.dsar_requests for select
  to authenticated
  using (public.is_operator());

-- 3. notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  title_en text,
  title_ar text,
  body_en text,
  body_ar text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

drop policy if exists "users select own notifications" on public.notifications;
create policy "users select own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "operator or self insert notifications" on public.notifications;
create policy "operator or self insert notifications"
  on public.notifications for insert
  to authenticated
  with check (public.is_operator() or auth.uid() = user_id);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read, created_at desc);
