import "server-only";
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
  interface_theme_color: string;
  interface_text_color: string;
  interface_card_color: string;
};

export async function getAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant | null> {
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
      "id, slug, name, stamps_required, reward_text, logo_url, background_color, background_image_url, interface_theme_color, interface_text_color, interface_card_color"
    )
    .eq("user_id", authedUser.id)
    .single();

  if (!restaurant) return null;

  return {
    ...restaurant,
    interface_theme_color: restaurant.interface_theme_color ?? DEFAULT_INTERFACE_THEME_COLOR,
    interface_text_color: restaurant.interface_text_color ?? DEFAULT_INTERFACE_TEXT_COLOR,
    interface_card_color: restaurant.interface_card_color ?? DEFAULT_INTERFACE_CARD_COLOR,
  };
}

export async function requireAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant> {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) throw new Error("Non authentifié ou aucun restaurant associé à ce compte");
  return restaurant;
}
