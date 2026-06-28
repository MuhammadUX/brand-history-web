-- WEB-2 / DS-1: lock the payment tables.
--
-- Users could previously self-INSERT/UPDATE their own subscriptions and
-- self-INSERT payment_events (the mock-checkout shape). In the real model these
-- rows are written ONLY by the service-role grant path (grant.ts / renew.ts via
-- the Moyasar webhook), so a user must never be able to forge entitlements.
--
-- Drop the user self-write policies. Keep the *_select_own read policies so a
-- user can still read their own subscription + payment history. Service-role
-- writes bypass RLS, so no replacement write policy is needed.
--
-- Caveat: the mock checkout (`runCheckout`, a user-session write) will no longer
-- work — that is intended (subscriptions are hidden in the free model; prod uses
-- Moyasar + service role).

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
drop policy if exists "subscriptions_update_own" on public.subscriptions;
drop policy if exists "payment_events_insert_own" on public.payment_events;
