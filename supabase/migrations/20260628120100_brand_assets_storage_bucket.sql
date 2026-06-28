-- Public Storage bucket for real brand-asset image files (logos, wordmarks,
-- icons). Brand logos are public, so the bucket is public (read needs no auth).
-- Operators (is_operator(): editor/admin) may insert/update/delete objects in
-- this bucket; everyone may read (public bucket). Idempotent.

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Operator write policies on storage.objects, scoped to the brand-assets bucket.
drop policy if exists "operators insert brand-assets objects" on storage.objects;
create policy "operators insert brand-assets objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-assets' and public.is_operator());

drop policy if exists "operators update brand-assets objects" on storage.objects;
create policy "operators update brand-assets objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'brand-assets' and public.is_operator())
  with check (bucket_id = 'brand-assets' and public.is_operator());

drop policy if exists "operators delete brand-assets objects" on storage.objects;
create policy "operators delete brand-assets objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'brand-assets' and public.is_operator());

-- Public read for the bucket. (A public bucket is served without auth, but an
-- explicit select policy keeps signed/API reads working under RLS too.)
drop policy if exists "public read brand-assets objects" on storage.objects;
create policy "public read brand-assets objects" on storage.objects
  for select to public
  using (bucket_id = 'brand-assets');
