-- Per-restaurant "interface theme" colors for the entreprise app's own
-- chrome (sidebar/nav accent, body text, KPI/stat card backgrounds).
--
-- These are independent of background_color/background_image_url (added in
-- 005_card_background.sql), which style the LOYALTY CARD itself
-- (LoyaltyCard.tsx) and are synced to Apple/Google Wallet passes -- those
-- two columns are untouched by this migration, and the new columns below
-- are never sent to Apple/Google Wallet.
--
-- Nullable, no DB default: existing restaurants keep rendering via the
-- fallback defaults applied in application code (see
-- getAuthenticatedRestaurant in src/lib/restaurant-auth.ts).
alter table restaurants add column if not exists interface_theme_color text;
alter table restaurants add column if not exists interface_text_color text;
alter table restaurants add column if not exists interface_card_color text;
