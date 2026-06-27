
-- Harden RBAC helpers: they must not be directly callable via PostgREST RPC by
-- anon/authenticated clients. RLS policy evaluation calls these inside
-- SECURITY DEFINER context and does NOT require EXECUTE grant to the caller,
-- so revoking EXECUTE keeps all RLS policies working while closing the RPC
-- surface that let clients probe is_operator()/is_admin() directly.
revoke execute on function public.is_operator() from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;
