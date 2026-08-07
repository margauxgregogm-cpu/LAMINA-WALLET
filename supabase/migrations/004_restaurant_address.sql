-- Optional restaurant address, editable from the admin panel.
-- Run this in the Supabase SQL editor for the project.

alter table restaurants
  add column address text;
