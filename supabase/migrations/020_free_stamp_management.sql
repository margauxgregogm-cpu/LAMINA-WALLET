-- Free stamp management (per restaurant): lets an entreprise choose freely
-- how many stamps to add or remove instead of the fixed +1 per visit.
-- Defaults to false so every existing restaurant keeps today's exact
-- behavior (scan = +1, search = +1, no removal) until an admin opts in.
alter table restaurants
  add column if not exists free_stamp_management boolean not null default false;

-- Lets the Apple Wallet PassKit web-service route (see
-- src/app/api/apple-wallet/v1/passes/.../route.ts) detect a stamp change
-- that isn't a real visit -- a manual add/retrait via the client fiche, or
-- a gestion-libre scan, never touches last_visit_at (see stamp_adjustments
-- below, kept out of `visits` on purpose). Without this, the route's
-- Last-Modified computation could miss those changes and an iPhone's own
-- periodic recheck (independent of the APNs push) could get a stale 304.
-- Purely additive to the existing
-- MAX(restaurant.updated_at, client.last_visit_at) check -- every path that
-- already updates last_visit_at (recordVisit) is untouched and unaffected.
alter table clients
  add column if not exists stamps_updated_at timestamptz;

-- Audit trail for manual stamp adjustments (gestion libre ON): who/when/how
-- much, kept separate from `visits` so these never count as real physical
-- visits in total_visits, the visit-frequency panel, or the dashboard KPIs.
create table if not exists stamp_adjustments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  delta int not null,
  stamps_before int not null,
  stamps_after int not null,
  created_at timestamptz not null default now()
);

create index if not exists stamp_adjustments_client_idx
  on stamp_adjustments (client_id, created_at desc);

alter table stamp_adjustments enable row level security;
-- No anon policies on purpose -- only the server (service_role) ever
-- reads/writes this table, same as every other write path in this project.
