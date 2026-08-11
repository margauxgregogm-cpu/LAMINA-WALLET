-- Push notification plans, per restaurant, administered from the admin app.
-- Nothing here touches Apple/Google Wallet pass generation.

-- Which extra options an admin has switched on for a restaurant. Nullable /
-- default-false so every existing restaurant simply has the feature off.
alter table restaurants add column if not exists push_notifications_enabled boolean not null default false;
-- 'option1' (1/quarter) | 'option2' (3/month) | 'option3' (15/month).
-- Kept as free text rather than an enum so adding a plan later is a code
-- change only, matching how `category` is handled.
alter table restaurants add column if not exists push_plan text;

-- One row per notification a restaurant sends. Doubles as the quota ledger:
-- usage for a period is a count over this table, so a plan change or an
-- admin toggling the feature off never loses history.
create table if not exists push_notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  message text not null,
  status text not null default 'sent',
  -- Identifies the quota window the send was charged to, e.g. '2026-M08'
  -- for monthly plans or '2026-Q3' for the quarterly one. Computed in
  -- src/lib/push-plans.ts (Europe/Paris), stored so history stays readable
  -- even if a restaurant later moves to a plan with a different period.
  period_key text not null,
  -- How many registered Apple Wallet devices the push was fanned out to.
  recipients_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists push_notifications_quota_idx
  on push_notifications (restaurant_id, period_key);
create index if not exists push_notifications_recent_idx
  on push_notifications (restaurant_id, created_at desc);

alter table push_notifications enable row level security;
-- No anon policies on purpose -- only the server (service_role) reads or
-- writes this table, same as apple_wallet_registrations.

-- Atomic "check the quota and record the send in one go".
--
-- Counting then inserting from the application would let two near-simultaneous
-- requests both read "1 left" and both insert, taking the restaurant over its
-- plan. Locking the restaurants row first serialises concurrent sends for that
-- restaurant, so the count is always read after any in-flight send has
-- committed. Returns the new row's id, or null when the quota is exhausted --
-- the caller must treat null as a refusal.
create or replace function consume_push_quota(
  p_restaurant_id uuid,
  p_message text,
  p_period_key text,
  p_limit int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
  v_id uuid;
begin
  perform 1 from restaurants where id = p_restaurant_id for update;

  select count(*) into v_used
  from push_notifications
  where restaurant_id = p_restaurant_id
    and period_key = p_period_key
    and status = 'sent';

  if v_used >= p_limit then
    return null;
  end if;

  insert into push_notifications (restaurant_id, message, status, period_key)
  values (p_restaurant_id, p_message, 'sent', p_period_key)
  returning id into v_id;

  return v_id;
end;
$$;
