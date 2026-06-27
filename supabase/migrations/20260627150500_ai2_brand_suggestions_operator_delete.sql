-- AI-2: allow operators to dismiss (delete) junk brand suggestions.
-- Public users can INSERT suggestions; operators read/update them. This adds a
-- DELETE policy gated on is_operator() (matching the existing operator policies)
-- so the dismissSuggestion server action (operator-only, audited) can
-- hard-delete spam/junk rows.

drop policy if exists "operators delete suggestions" on public.brand_suggestions;

create policy "operators delete suggestions"
  on public.brand_suggestions
  for delete
  using (is_operator());
