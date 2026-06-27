create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  kind text not null default 'logo',
  created_at timestamptz not null default now()
);

create index if not exists downloads_user_created_idx
  on public.downloads (user_id, created_at desc);

alter table public.downloads enable row level security;

create policy downloads_select_own on public.downloads
  for select using (auth.uid() = user_id);
create policy downloads_insert_own on public.downloads
  for insert with check (auth.uid() = user_id);
create policy downloads_delete_own on public.downloads
  for delete using (auth.uid() = user_id);