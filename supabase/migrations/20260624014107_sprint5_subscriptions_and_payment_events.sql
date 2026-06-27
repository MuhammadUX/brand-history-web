-- Sprint 5: Pro subscriptions + payment event log (mock PSP shape)

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'none' check (status in ('none','trialing','active','past_due','canceled')),
  plan text check (plan in ('monthly','annual')),
  entitlements jsonb not null default '{"ad_free":false,"bulk_zip":false,"high_res":false,"api":false,"advanced_search":false}'::jsonb,
  provider text default 'mock',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Append-only payment/webhook event log (demonstrates webhook/idempotency shape)
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mock',
  event_type text not null,
  amount_sar numeric,
  plan text,
  detail jsonb,
  created_at timestamptz default now()
);

alter table public.payment_events enable row level security;

create policy "payment_events_select_own" on public.payment_events
  for select using (auth.uid() = user_id);
create policy "payment_events_insert_own" on public.payment_events
  for insert with check (auth.uid() = user_id);

create index if not exists payment_events_user_idx on public.payment_events(user_id, created_at desc);