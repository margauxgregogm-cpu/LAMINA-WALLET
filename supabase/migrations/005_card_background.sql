-- Replaces the fixed 4-theme color_theme with a free-choice background:
-- either a hex color (any color, not just the 4 presets) or an uploaded
-- background image. Existing restaurants are backfilled with the hex
-- equivalent of their current theme so nothing changes visually until
-- the admin picks a new color/image.
-- Run this in the Supabase SQL editor for the project.

alter table restaurants add column background_color text;
alter table restaurants add column background_image_url text;

update restaurants set background_color = case color_theme
  when 'anthracite' then '#27272a'
  when 'white' then '#ffffff'
  when 'gray' then '#71717a'
  when 'navy' then '#172554'
  else '#27272a'
end;

alter table restaurants alter column background_color set not null;
alter table restaurants alter column background_color set default '#27272a';

alter table restaurants drop column color_theme;
