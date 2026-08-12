-- Option 4: admin-defined custom monthly push quota, per restaurant.
-- Options 1-3 keep their fixed limits in src/lib/push-plans.ts; option4 has
-- no fixed limit there -- it's set per restaurant by an admin and stored
-- here instead. Nullable with no default, so every existing restaurant
-- (all currently on option1/2/3 or no plan) is completely unaffected.
-- Run this in the Supabase SQL editor for the project.

alter table restaurants add column if not exists push_custom_limit integer;

-- Mirrors the validation in updateRestaurantOptions (admin/(app)/restaurants/actions.ts):
-- only a positive integer is ever allowed, enforced here too so the column
-- can't end up with 0/negative values even from a manual SQL edit.
-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS" -- this migration is meant
-- to be run once, like the others in this folder.)
alter table restaurants
  add constraint push_custom_limit_positive
  check (push_custom_limit is null or push_custom_limit > 0);
