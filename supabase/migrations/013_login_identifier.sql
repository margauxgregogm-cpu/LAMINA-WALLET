-- Adds a login identifier for Entreprise accounts, so a restaurant can log
-- in with a plain identifier (e.g. "dupont") instead of an email address.
-- The underlying Supabase Auth user, its email and its password are left
-- completely untouched -- the login flow (see loginRestaurant in
-- src/app/restaurant/login/actions.ts) resolves identifier -> restaurant ->
-- user_id -> that user's existing (now purely internal/technical) email
-- server-side, then signs in with the password exactly as before.
-- Run this in the Supabase SQL editor for the project.

alter table restaurants add column if not exists login_identifier text;

-- Generated column so matching is case- and whitespace-insensitive
-- ("Dupont" = "dupont" = " dupont ") without forcing lowercase storage --
-- the identifier is still shown to the admin exactly as typed.
alter table restaurants
  add column if not exists login_identifier_normalized text
  generated always as (lower(trim(login_identifier))) stored;

create unique index if not exists restaurants_login_identifier_key
  on restaurants (login_identifier_normalized);

-- Backfill: existing accounts keep their current Supabase Auth email and
-- password untouched -- this only attaches the new, separate identifier
-- chosen for each business (confirmed by the business owner, 2026-08-12).
update restaurants set login_identifier = 'All in' where id = '9afefe06-9f02-492d-bfdf-6139004400ca';
update restaurants set login_identifier = 'O Sole Mio' where id = 'a15d1ee0-4fd9-48df-9800-9d070407e85b';
update restaurants set login_identifier = 'Majestic cars wash' where id = '80c9bb55-a851-4519-bce6-2e31a9ddd247';
update restaurants set login_identifier = 'Ocean Nails' where id = '8796c330-feb7-4075-a87f-692a36c3efed';
update restaurants set login_identifier = 'Yin yang' where id = '8f97ad17-d26d-4e72-9424-d6003c3f7d7e';
update restaurants set login_identifier = 'Omusubi' where id = 'bda37967-128e-4074-9a1e-62535577915a';
update restaurants set login_identifier = 'Hair by Faty' where id = 'd8178a79-04b2-45ca-9136-d85c64201429';
update restaurants set login_identifier = 'WAW' where id = '3d50feba-925f-4ecb-8b72-54c35f78274d';
update restaurants set login_identifier = 'Skin Chic' where id = 'd73ef016-889b-4afd-ad10-cbbc93fdd70c';
update restaurants set login_identifier = 'Pizza Amika' where id = '4b6e63af-6284-4fa9-9280-f8d4b65b50b5';
update restaurants set login_identifier = 'test' where id = '35044905-22dd-4ecc-8893-18c378dc383a';
update restaurants set login_identifier = 'Le Villeneuvois' where id = 'fcab9d69-cc1e-4f47-b747-91abed799301';
update restaurants set login_identifier = 'CIR industrie' where id = '1f09b945-ceea-4ea1-b9c0-028c29ea7e5a';

-- Once every existing restaurant has an identifier, require it going
-- forward (new restaurants must be created with one -- see createRestaurant
-- in src/app/admin/(app)/restaurants/actions.ts).
alter table restaurants alter column login_identifier set not null;
