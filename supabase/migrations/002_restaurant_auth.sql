-- Links a restaurant row to a Supabase Auth user, so the restaurant can log in.
-- Run this in the Supabase SQL editor for the project.

alter table restaurants
  add column user_id uuid references auth.users(id);

create unique index restaurants_user_id_key on restaurants(user_id);
