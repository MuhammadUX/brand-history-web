-- Revert the over-aggressive revoke: these helpers are referenced in RLS policies
-- bound to role `public`, so anon/authenticated MUST be able to evaluate them.
-- The functions leak nothing sensitive (they only report whether the CURRENT caller
-- is an operator/admin based on their own profile), so re-granting is safe.
grant execute on function public.is_operator() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;