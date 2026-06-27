
drop function if exists public._probe();

-- Detect privileged callers allowed to change roles/state.
-- service_role detection: the app's server client connects with the service-role
-- JWT, so auth.role() = 'service_role'. We also accept a raw SET ROLE service_role
-- (session/current user) for direct DB tooling. Inside a SECURITY DEFINER function
-- current_user/session_user resolve to the owner, so auth.role() (which reads the
-- JWT role claim from request.jwt.claims) is the reliable signal at runtime.
create or replace function public._is_privileged_role_writer()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return is_admin()
    or coalesce(auth.role(), '') = 'service_role'
    or current_user = 'service_role'
    or session_user = 'service_role';
end;
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public._is_privileged_role_writer() then
      raise exception 'not authorized to change role';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_brand_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.publication_state is distinct from old.publication_state then
    if not public._is_privileged_role_writer() then
      raise exception 'not authorized to change publication_state';
    end if;
  end if;
  return new;
end;
$$;
