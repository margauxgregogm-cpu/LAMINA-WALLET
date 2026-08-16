import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Fallbacks for restaurants that predate the interface-theming columns
// (010_interface_theme_colors.sql) or simply never had them customized —
// keeps every existing restaurant rendering exactly as before with zero
// migration risk. Distinct from LoyaltyCard's own background_color default
// ("#27272a") since these style the app chrome, not the loyalty card.
const DEFAULT_INTERFACE_THEME_COLOR = "#059669";
const DEFAULT_INTERFACE_TEXT_COLOR = "#18181b";
const DEFAULT_INTERFACE_CARD_COLOR = "#ffffff";

export type AuthenticatedRestaurant = {
  id: string;
  slug: string;
  name: string;
  stamps_required: number;
  reward_text: string;
  logo_url: string | null;
  background_color: string;
  background_image_url: string | null;
  wallet_text_color: string | null;
  interface_theme_color: string;
  interface_text_color: string;
  interface_card_color: string;
  collect_first_name: boolean;
  collect_last_name: boolean;
  collect_phone: boolean;
  collect_email: boolean;
  collect_city: boolean;
  collect_civilite: boolean;
  collect_date_naissance: boolean;
  collect_adresse_postale: boolean;
  collect_profession: boolean;
  collect_nationalite: boolean;
  collect_code_parrainage: boolean;
  free_stamp_management: boolean;
};

// Wrapped in React's cache() so the layout, generateViewport, and the page
// itself (which each need the authenticated restaurant independently) share
// one Supabase round trip per request instead of paying for it 2-3 times.
export const getAuthenticatedRestaurant = cache(async function getAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant | null> {
  const supabase = await createClient("restaurant");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  let authedUser = user;
  if (!authedUser && error) {
    // getUser() calls out to Supabase's Auth server to re-verify the token —
    // a transient network hiccup there isn't the same as being logged out.
    // Fall back to the locally cached session (read straight from the
    // cookie, no network call) so a flaky request doesn't bounce the
    // restaurant to the login screen.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    authedUser = session?.user ?? null;
  }

  if (!authedUser) return null;

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select(
      "id, slug, name, stamps_required, reward_text, logo_url, background_color, background_image_url, wallet_text_color, interface_theme_color, interface_text_color, interface_card_color, collect_first_name, collect_last_name, collect_phone, collect_email, collect_city, collect_civilite, collect_date_naissance, collect_adresse_postale, collect_profession, collect_nationalite, collect_code_parrainage, free_stamp_management"
    )
    .eq("user_id", authedUser.id)
    .single();

  if (!restaurant) return null;

  return {
    ...restaurant,
    interface_theme_color: restaurant.interface_theme_color ?? DEFAULT_INTERFACE_THEME_COLOR,
    interface_text_color: restaurant.interface_text_color ?? DEFAULT_INTERFACE_TEXT_COLOR,
    interface_card_color: restaurant.interface_card_color ?? DEFAULT_INTERFACE_CARD_COLOR,
    // Restaurants that predate the RGPD field config (or if a column is
    // ever null) keep collecting exactly the 5 fields they collect today.
    collect_first_name: restaurant.collect_first_name ?? true,
    collect_last_name: restaurant.collect_last_name ?? true,
    collect_phone: restaurant.collect_phone ?? true,
    collect_email: restaurant.collect_email ?? true,
    collect_city: restaurant.collect_city ?? true,
    // The 6 additional fields are brand new data points -- default OFF, so
    // adding them never changes what an existing restaurant already collects.
    collect_civilite: restaurant.collect_civilite ?? false,
    collect_date_naissance: restaurant.collect_date_naissance ?? false,
    collect_adresse_postale: restaurant.collect_adresse_postale ?? false,
    collect_profession: restaurant.collect_profession ?? false,
    collect_nationalite: restaurant.collect_nationalite ?? false,
    collect_code_parrainage: restaurant.collect_code_parrainage ?? false,
    // New per-restaurant option -- defaults OFF so every existing
    // restaurant keeps today's fixed +1-per-visit behavior unchanged.
    free_stamp_management: restaurant.free_stamp_management ?? false,
  };
});

export async function requireAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant> {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) throw new Error("Non authentifié ou aucun restaurant associé à ce compte");
  return restaurant;
}
