-- Lamina Wallet / Food Club schema
-- Run this in the Supabase SQL editor for the project.

create extension if not exists pgcrypto;

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  color_theme text not null default 'anthracite', -- anthracite | white | gray | navy
  stamps_required int not null default 8,
  reward_text text not null default '8e offert',
  welcome_offer_text text,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  city text,
  stamps int not null default 0,
  is_vip boolean not null default false,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  unique (restaurant_id, email)
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table restaurants enable row level security;
alter table clients enable row level security;
alter table visits enable row level security;

-- Public read of restaurant branding (needed for the signup page to render the card).
create policy "public read restaurants"
  on restaurants for select
  using (true);

-- All writes go through the server (service_role), which bypasses RLS.
-- No anon insert/update/delete policies are defined on purpose.

-- Seed a demo restaurant for local testing.
insert into restaurants (slug, name, color_theme, stamps_required, reward_text, welcome_offer_text)
values ('demo', 'Lamina Wallet', 'anthracite', 8, '8e offert', 'Boisson offerte pour votre 1ere visite');
