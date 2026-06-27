
-- ===== brands: credit + usage-rule + voice columns =====
alter table brands add column if not exists designer_credit text;
alter table brands add column if not exists agency text;
alter table brands add column if not exists credit_source_url text;
alter table brands add column if not exists clear_space text;
alter table brands add column if not exists min_size text;
alter table brands add column if not exists voice_en text;
alter table brands add column if not exists voice_ar text;

-- ===== timeline_entries: per-era logo image + change kind + credit + source =====
alter table timeline_entries add column if not exists logo_url text;
alter table timeline_entries add column if not exists change_kind text;
alter table timeline_entries add column if not exists credit text;
alter table timeline_entries add column if not exists source_url text;

-- ===== brand_fonts =====
create table if not exists brand_fonts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  family text not null,
  role text,                       -- display | text | mono | arabic
  specimen_en text,
  specimen_ar text,
  weights text,                    -- e.g. "400, 500, 700"
  policy text not null default 'specimen_only' check (policy in ('host','link_out','specimen_only')),
  license text,
  foundry text,
  source_url text,
  css_stack text,                  -- CSS font-family to render specimen when web-available
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists brand_fonts_brand_idx on brand_fonts(brand_id);

-- ===== brand_guidelines (do / don't) =====
create table if not exists brand_guidelines (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  kind text not null check (kind in ('do','dont')),
  text_en text not null,
  text_ar text,
  sort_order int not null default 0
);
create index if not exists brand_guidelines_brand_idx on brand_guidelines(brand_id);

-- ===== brand_applications (in the wild) =====
create table if not exists brand_applications (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  context text not null,           -- app_icon | signage | packaging | social | billboard | merch | website
  image_url text,
  caption_en text,
  caption_ar text,
  bg_color text,                   -- placeholder tile bg when no image
  sort_order int not null default 0
);
create index if not exists brand_applications_brand_idx on brand_applications(brand_id);

-- ===== RLS: mirror existing child tables =====
alter table brand_fonts enable row level security;
alter table brand_guidelines enable row level security;
alter table brand_applications enable row level security;

-- brand_fonts
create policy "public read fonts of published brands" on brand_fonts for select to public
  using (exists (select 1 from brands b where b.id = brand_fonts.brand_id and b.publication_state = 'published'::publication_state));
create policy "operators read all fonts" on brand_fonts for select to public using (is_operator());
create policy "operators insert fonts" on brand_fonts for insert to public with check (is_operator());
create policy "operators update fonts" on brand_fonts for update to public using (is_operator());
create policy "operators delete fonts" on brand_fonts for delete to public using (is_operator());

-- brand_guidelines
create policy "public read guidelines of published brands" on brand_guidelines for select to public
  using (exists (select 1 from brands b where b.id = brand_guidelines.brand_id and b.publication_state = 'published'::publication_state));
create policy "operators read all guidelines" on brand_guidelines for select to public using (is_operator());
create policy "operators insert guidelines" on brand_guidelines for insert to public with check (is_operator());
create policy "operators update guidelines" on brand_guidelines for update to public using (is_operator());
create policy "operators delete guidelines" on brand_guidelines for delete to public using (is_operator());

-- brand_applications
create policy "public read applications of published brands" on brand_applications for select to public
  using (exists (select 1 from brands b where b.id = brand_applications.brand_id and b.publication_state = 'published'::publication_state));
create policy "operators read all applications" on brand_applications for select to public using (is_operator());
create policy "operators insert applications" on brand_applications for insert to public with check (is_operator());
create policy "operators update applications" on brand_applications for update to public using (is_operator());
create policy "operators delete applications" on brand_applications for delete to public using (is_operator());
