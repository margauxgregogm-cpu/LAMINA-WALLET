-- Extends the RGPD field-configuration system (018_rgpd_collect_fields_and_notes.sql)
-- with 6 more optional client fields. Same mechanism, nothing about how it
-- works changes -- just a longer list of collect_* flags and matching
-- client columns.
--
-- Unlike the original 5 (which default to true, preserving pre-RGPD
-- behavior), these 6 default to FALSE: they're brand new data points no
-- restaurant has ever collected, so every restaurant -- existing or new --
-- starts with them off until an admin actively turns one on.

alter table restaurants
  add column if not exists collect_civilite       boolean not null default false,
  add column if not exists collect_date_naissance  boolean not null default false,
  add column if not exists collect_adresse_postale boolean not null default false,
  add column if not exists collect_profession      boolean not null default false,
  add column if not exists collect_nationalite     boolean not null default false,
  add column if not exists collect_code_parrainage boolean not null default false;

alter table clients
  add column if not exists civilite text,
  add column if not exists date_naissance date,
  add column if not exists adresse_postale text,
  add column if not exists profession text,
  add column if not exists nationalite text,
  add column if not exists code_parrainage text;
