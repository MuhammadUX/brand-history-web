create unique index if not exists payment_events_succeeded_invoice_uniq
on payment_events (provider, (detail->>'invoice_id'))
where event_type = 'payment_succeeded' and detail->>'invoice_id' is not null;