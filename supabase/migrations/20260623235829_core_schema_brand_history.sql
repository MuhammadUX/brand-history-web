
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$ begin
  create type publication_state as enum ('draft','in_review','approved','published','unpublished');
exception when duplicate_object then null; end $$;
do $$ begin
  create type claim_status as enum ('unclaimed','claimed','verified');
exception when duplicate_object then null; end $$;

create table if not exists sectors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_ar text not null,
  sort_order int not null default 0
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_ar text not null,
  sector_id uuid references sectors(id),
  region text not null default 'KSA',
  founded_year int,
  summary_en text,
  summary_ar text,
  primary_color text not null default '#3B5BDB',
  initials text,
  claim_status claim_status not null default 'unclaimed',
  publication_state publication_state not null default 'published',
  is_verified boolean not null default false,
  download_count int not null default 0,
  row_version int not null default 0,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists brands_sector_idx on brands(sector_id);
create index if not exists brands_state_idx on brands(publication_state);
create index if not exists brands_name_en_trgm on brands using gin (name_en gin_trgm_ops);
create index if not exists brands_name_ar_trgm on brands using gin (name_ar gin_trgm_ops);

create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  asset_type text not null default 'logo_primary',
  name_en text not null,
  name_ar text not null,
  download_policy text not null default 'host',
  formats text[] not null default '{svg,png}',
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists brand_assets_brand_idx on brand_assets(brand_id);

create table if not exists brand_colors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  hex text not null,
  role text not null default 'primary',
  sort_order int not null default 0
);
create index if not exists brand_colors_brand_idx on brand_colors(brand_id);

create table if not exists timeline_entries (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  year int not null,
  title_en text not null,
  title_ar text not null,
  description_en text,
  description_ar text,
  category text not null default 'identity_update',
  is_archived boolean not null default false,
  sort_order int not null default 0
);
create index if not exists timeline_brand_idx on timeline_entries(brand_id);

alter table sectors enable row level security;
alter table brands enable row level security;
alter table brand_assets enable row level security;
alter table brand_colors enable row level security;
alter table timeline_entries enable row level security;

create policy "public read sectors" on sectors for select using (true);
create policy "public read published brands" on brands for select using (publication_state = 'published');
create policy "public read assets of published brands" on brand_assets for select
  using (exists (select 1 from brands b where b.id = brand_id and b.publication_state = 'published'));
create policy "public read colors of published brands" on brand_colors for select
  using (exists (select 1 from brands b where b.id = brand_id and b.publication_state = 'published'));
create policy "public read timeline of published brands" on timeline_entries for select
  using (exists (select 1 from brands b where b.id = brand_id and b.publication_state = 'published'));
