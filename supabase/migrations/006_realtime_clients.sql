-- Lets a logged-in restaurant read (and subscribe to changes on) its own
-- clients, and enables Realtime so the dashboard can update live when a
-- new client signs up.
-- Run this in the Supabase SQL editor for the project.

create policy "restaurant reads own clients"
  on clients for select
  using (restaurant_id in (select id from restaurants where user_id = auth.uid()));

alter publication supabase_realtime add table clients;
