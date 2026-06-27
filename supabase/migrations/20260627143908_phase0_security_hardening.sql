
-- SEC-1: prevent privilege escalation on profiles via role change
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not (is_admin() or current_user = 'service_role') then
      raise exception 'not authorized to change role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_escalation();

-- SEC-2: brands DELETE policy - admin only, draft/archived only
drop policy if exists "operators delete brands" on public.brands;
create policy "operators delete brands"
  on public.brands
  for delete
  using (is_admin() and publication_state in ('draft','archived'));

-- SEC-3: prevent non-admins changing brand publication_state at the DB
create or replace function public.prevent_brand_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.publication_state is distinct from old.publication_state then
    if not (is_admin() or current_user = 'service_role') then
      raise exception 'not authorized to change publication_state';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_brand_state_change on public.brands;
create trigger trg_prevent_brand_state_change
  before update on public.brands
  for each row
  execute function public.prevent_brand_state_change();
