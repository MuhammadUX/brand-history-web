-- WEB-1 / STOR-1 / WEB-6: lock down the public `brand-assets` Storage bucket.
--
-- Uploads now flow exclusively through the operator-gated server route
-- (`/api/admin/upload-asset`), which validates MIME + size, sanitizes SVGs, and
-- writes via the SERVICE-ROLE key. So:
--   (a) constrain the bucket itself (allowed_mime_types + file_size_limit) as
--       defense-in-depth;
--   (b) remove the operator INSERT/UPDATE/DELETE policies on storage.objects so
--       NO client (operator or otherwise) can write the bucket directly — only
--       the service role (which bypasses RLS) can write, via the route;
--   (c) drop the broad public SELECT (listing) policy so anon can't enumerate
--       the bucket. Public bucket objects remain readable by direct URL without
--       a SELECT policy, so direct logo reads are unaffected.

-- (a) Bucket-level constraints (defense-in-depth).
update storage.buckets
set
  allowed_mime_types = array['image/svg+xml','image/png','image/jpeg','image/webp'],
  file_size_limit = 5242880 -- 5 MB
where id = 'brand-assets';

-- (b) Remove client write policies for this bucket. Writes are service-role only
--     (service role bypasses RLS entirely; no policy needed for it).
drop policy if exists "operators insert brand-assets objects" on storage.objects;
drop policy if exists "operators update brand-assets objects" on storage.objects;
drop policy if exists "operators delete brand-assets objects" on storage.objects;

-- (c) Drop the broad public listing/SELECT policy so anon cannot enumerate the
--     bucket. Direct object-URL reads on a public bucket do not require this.
drop policy if exists "public read brand-assets objects" on storage.objects;
