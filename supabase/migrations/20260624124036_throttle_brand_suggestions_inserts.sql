
-- Lightweight rate-limit for anonymous brand_suggestions inserts.
-- The INSERT RLS policy is `with check (true)` (open to anon), so we add a
-- BEFORE INSERT trigger as a defense-in-depth throttle.
--
-- Thresholds (modest, tunable):
--   * Per-email: max 5 inserts per rolling hour (only when email is provided).
--   * Global:    max 20 inserts per rolling hour (safety cap across all anon).
--
-- SECURITY DEFINER so the count query can read existing rows regardless of the
-- (restrictive) SELECT policy on brand_suggestions for the anon role.
create or replace function public.enforce_brand_suggestion_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  email_count integer;
  global_count integer;
begin
  -- Per-email throttle (only when an email is supplied).
  if new.email is not null and length(btrim(new.email)) > 0 then
    select count(*) into email_count
    from public.brand_suggestions
    where lower(email) = lower(btrim(new.email))
      and created_at > now() - interval '1 hour';

    if email_count >= 5 then
      raise exception 'Too many suggestions from this email in the last hour. Please try again later.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Global safety cap across all submissions.
  select count(*) into global_count
  from public.brand_suggestions
  where created_at > now() - interval '1 hour';

  if global_count >= 20 then
    raise exception 'Suggestion submissions are temporarily rate-limited. Please try again later.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Restrict who may call the function directly; the trigger invokes it as owner.
revoke execute on function public.enforce_brand_suggestion_rate_limit() from anon, authenticated, public;

drop trigger if exists trg_brand_suggestions_rate_limit on public.brand_suggestions;
create trigger trg_brand_suggestions_rate_limit
  before insert on public.brand_suggestions
  for each row
  execute function public.enforce_brand_suggestion_rate_limit();
