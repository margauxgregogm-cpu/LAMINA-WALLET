-- RGPD field configuration (per restaurant), internal notes (restaurant +
-- client), and relaxed NOT NULL constraints so a client can be created
-- without a field the restaurant has chosen not to collect.
--
-- All 5 collect_* flags default to true, so every existing restaurant keeps
-- collecting exactly the 5 fields it collects today -- zero backfill, zero
-- behavior change until an admin actively unchecks something.

alter table restaurants
  add column if not exists collect_first_name boolean not null default true,
  add column if not exists collect_last_name  boolean not null default true,
  add column if not exists collect_phone      boolean not null default true,
  add column if not exists collect_email      boolean not null default true,
  add column if not exists collect_city       boolean not null default true;

-- Free-text internal notes. `text` has no practical length limit in
-- Postgres (unlike varchar(n)), matching the "no character limit" requirement.
alter table restaurants add column if not exists internal_note text;
alter table clients add column if not exists internal_note text;

-- Lets first_name/email be absent when a restaurant has turned that field
-- off. Existing rows are untouched -- this only removes a constraint on
-- future writes, it doesn't validate or rewrite current data.
alter table clients alter column first_name drop not null;
alter table clients alter column email drop not null;
