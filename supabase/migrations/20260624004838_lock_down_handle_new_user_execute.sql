-- handle_new_user() is a trigger-only SECURITY DEFINER function; it must not be
-- callable via the REST RPC endpoint by anon/authenticated roles.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
-- The trigger fires as the table owner regardless, so this does not break signup.