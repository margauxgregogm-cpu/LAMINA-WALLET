-- Per-restaurant stamp rendering style: lets an entreprise choose how earned
-- stamps are shown on the loyalty card (Wallet + web preview), independently
-- of stamps_required (which controls the loyalty program itself, not its
-- visual style -- see also stamps_required = 0, handled entirely in
-- application code, not here).
--
-- 'color'   -- current behavior: filled circles in a solid color.
-- 'image'   -- filled circles show an uploaded PNG instead of a color.
-- 'counter' -- no circles at all, only the "X / Y" progress text (already
--              rendered as a native field on both wallets, see
--              src/lib/apple-wallet.ts headerFields and
--              src/lib/google-wallet.ts loyaltyPoints -- nothing new needed
--              there, only the circle-grid image generation changes).
--
-- Defaults to 'color' with null color/image so every existing restaurant
-- keeps exactly today's rendering (fixed green circles) until an admin
-- opens the new "Style des tampons" section and saves a change.
alter table restaurants add column if not exists stamp_display_style text not null default 'color';
alter table restaurants add column if not exists stamp_color text;
alter table restaurants add column if not exists stamp_image_url text;
