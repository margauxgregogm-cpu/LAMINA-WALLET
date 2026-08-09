-- Apple Wallet push updates: lets already-saved passes refresh themselves
-- (new stamp count, new background/reward text) without the client
-- re-adding the card.

-- Bumped explicitly by updateRestaurant() whenever a card-design field
-- changes, so the "what changed since tag X" web-service endpoint can tell
-- which already-registered passes need a push.
alter table restaurants add column if not exists updated_at timestamptz not null default now();

-- One row per (device, pass type, pass) that has registered for push
-- updates, per Apple's PassKit Web Service protocol.
create table if not exists apple_wallet_registrations (
  id uuid primary key default gen_random_uuid(),
  device_library_identifier text not null,
  pass_type_identifier text not null,
  serial_number text not null,
  push_token text not null,
  created_at timestamptz not null default now(),
  unique (device_library_identifier, pass_type_identifier, serial_number)
);

create index if not exists apple_wallet_registrations_serial_idx
  on apple_wallet_registrations (pass_type_identifier, serial_number);
create index if not exists apple_wallet_registrations_device_idx
  on apple_wallet_registrations (device_library_identifier, pass_type_identifier);

alter table apple_wallet_registrations enable row level security;
-- No anon policies on purpose -- only the server (service_role, via the
-- PassKit web-service routes) reads or writes this table.
