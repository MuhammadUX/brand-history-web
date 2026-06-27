create policy "pbr_delete_operator"
on public.profile_builder_runs
for delete
using (public.is_operator());