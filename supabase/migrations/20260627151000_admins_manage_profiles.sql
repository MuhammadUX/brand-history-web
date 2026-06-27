-- DEF-1 fix: the Team & Roles screen lets an admin change other users' roles,
-- but profiles only had own-row policies (profiles_select_own / profiles_update_own),
-- so an admin's cookie session couldn't even see, let alone update, other rows —
-- RLS filtered them out before the SEC-1 role-escalation trigger could allow it.
-- These admin-scoped policies grant that access; the SEC-1 trigger
-- (prevent_role_escalation) remains the guard that still blocks NON-admins.
create policy "admins select all profiles" on public.profiles
  for select using (public.is_admin());

create policy "admins update all profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
