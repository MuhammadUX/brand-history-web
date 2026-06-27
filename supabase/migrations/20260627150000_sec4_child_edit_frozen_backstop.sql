-- SEC-4: DB backstop preventing edits to brand child rows while the parent
-- brand is frozen (publication_state in 'published' or 'archived').
--
-- The app layer already gates child edits via loadEditableBrand; this trigger
-- is defense-in-depth at the database layer. Privileged callers
-- (service_role / admin, via public._is_privileged_role_writer()) are exempt so
-- maintenance jobs and the existing grant/publish flows still work.
--
-- One shared trigger function attached to all six child tables. The parent
-- brand_id is read from NEW (INSERT/UPDATE) or OLD (DELETE).

create or replace function public.reject_child_edit_when_frozen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid;
  v_state    publication_state;
begin
  -- Privileged callers bypass the freeze entirely.
  if public._is_privileged_role_writer() then
    return coalesce(new, old);
  end if;

  -- Resolve the affected brand_id from the row being changed.
  v_brand_id := coalesce(new.brand_id, old.brand_id);

  if v_brand_id is null then
    return coalesce(new, old);
  end if;

  select publication_state into v_state
  from public.brands
  where id = v_brand_id;

  -- Frozen states are not in the editable set.
  if v_state in ('published', 'archived') then
    raise exception
      'brand % is % and frozen; child records cannot be modified', v_brand_id, v_state
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'brand_colors',
    'brand_assets',
    'timeline_entries',
    'brand_fonts',
    'brand_guidelines',
    'brand_applications'
  ]
  loop
    execute format('drop trigger if exists trg_reject_child_edit_when_frozen on public.%I', tbl);
    execute format(
      'create trigger trg_reject_child_edit_when_frozen '
      || 'before insert or update or delete on public.%I '
      || 'for each row execute function public.reject_child_edit_when_frozen()',
      tbl
    );
  end loop;
end;
$$;
