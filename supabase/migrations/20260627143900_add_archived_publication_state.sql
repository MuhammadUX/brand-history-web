-- Adds the 'archived' value to publication_state.
-- This value existed in production (added during the archive/restore feature)
-- but was applied out-of-band and never recorded as a migration, so a clean
-- replay failed at phase0_security_hardening (which references 'archived').
-- Idempotent: a no-op where the value already exists (e.g. production).
alter type public.publication_state add value if not exists 'archived';
