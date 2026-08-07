-- Lifetime visit counter, separate from `stamps` which resets to 0 once a
-- reward is earned. Needed for the restaurant's top-clients leaderboard.
-- Run this in the Supabase SQL editor for the project.

alter table clients
  add column total_visits int not null default 0;
