-- Adds a login identifier for admin accounts, mirroring
-- 013_login_identifier.sql for Entreprise accounts: an admin can log in
-- with a plain identifier (e.g. "margaux") instead of their email address.
-- The underlying Supabase Auth user, its email and its password are left
-- completely untouched -- the login flow (see loginAdmin in
-- src/app/admin/login/actions.ts) resolves identifier -> admins row ->
-- user_id -> that user's existing (unchanged) email server-side, then signs
-- in with the password exactly as before. Admin authorization (isAdmin() /
-- ADMIN_EMAILS in src/lib/admin-auth.ts) is untouched -- it still checks the
-- session's real email after sign-in, so this table only adds a friendlier
-- way to reach that same session, it does not grant or change any right.
-- Run this in the Supabase SQL editor for the project.

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  login_identifier text,
  -- Generated column so matching is case- and whitespace-insensitive
  -- ("Margaux" = "margaux" = " margaux ") without forcing lowercase storage.
  login_identifier_normalized text generated always as (lower(trim(login_identifier))) stored,
  created_at timestamptz not null default now()
);

create unique index if not exists admins_login_identifier_key
  on admins (login_identifier_normalized);

-- No policies: every read/write goes through the server (service_role),
-- which bypasses RLS -- same posture as restaurants (see schema.sql).
-- Enabling RLS with no policies locks the table down by default for the
-- anon/authenticated roles, which never need direct access to it.
alter table admins enable row level security;

-- Backfill: one row per existing admin, found by their unchanged Supabase
-- Auth email, with the identifier the account holder chose (confirmed
-- 2026-08-12).
insert into admins (user_id, login_identifier)
select id, case
  when email = 'margauxgrego@gmail.com' then 'margaux'
  when email = 'barrautadrien@gmail.com' then 'adrien'
end
from auth.users
where email in ('margauxgrego@gmail.com', 'barrautadrien@gmail.com')
on conflict (user_id) do nothing;

-- Once every existing admin has an identifier, require it going forward.
alter table admins alter column login_identifier set not null;
