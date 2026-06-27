alter table subscriptions
  add column if not exists card_token text,
  add column if not exists card_last4 text,
  add column if not exists card_brand text,
  add column if not exists renew_attempts integer not null default 0,
  add column if not exists last_renewal_at timestamptz,
  add column if not exists renewal_state text not null default 'ok';

-- Helps the renewal cron quickly find subscriptions due to charge.
create index if not exists subscriptions_due_renewal_idx
  on subscriptions (current_period_end)
  where status = 'active' and cancel_at_period_end = false and card_token is not null;