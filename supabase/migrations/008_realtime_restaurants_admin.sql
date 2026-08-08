-- Mirrors migration 006's approach for clients: Realtime silently respects
-- RLS, so without a SELECT policy admin's realtime subscription on
-- `restaurants` would connect fine but never receive any events. Admin
-- access isn't modeled as a DB role/table yet (it's an env allowlist
-- checked in src/lib/admin-auth.ts) -- mirror that same allowlist here.
-- Keep this in sync with ADMIN_EMAILS if that list changes.
create policy "admins read all restaurants"
  on restaurants for select
  using (auth.jwt() ->> 'email' in ('margauxgrego@gmail.com', 'barrautadrien@gmail.com'));

alter publication supabase_realtime add table restaurants;
