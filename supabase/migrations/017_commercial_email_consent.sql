-- Commercial email consent (marketing opt-in), collected at signup and
-- modifiable later from the entreprise-side client sheet. Defaults to
-- false so every client that predates this column (created before the
-- checkbox existed) is treated as non-consenting, per opt-in rules -- no
-- backfill needed, Postgres applies the default to existing rows.
--
-- commercial_email_consent_at / _source record when/how the CURRENT value
-- was set ('signup' or 'restaurant') for consent traceability. Both stay
-- null for pre-existing clients, since they were never actually asked --
-- distinct from an explicit "false" answer.
alter table clients
  add column if not exists commercial_email_consent boolean not null default false,
  add column if not exists commercial_email_consent_at timestamptz,
  add column if not exists commercial_email_consent_source text;
