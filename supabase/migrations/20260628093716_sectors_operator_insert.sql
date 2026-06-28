-- Allow operators (editors/admins) to create sectors from the AI builder review
-- screen. The AI may suggest a sector that isn't in the taxonomy yet; the
-- operator can one-click create it. SELECT stays public (existing policy);
-- this adds only an INSERT policy gated by is_operator().

create policy "operators insert sectors"
  on sectors for insert
  with check (public.is_operator());
