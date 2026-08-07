import "server-only";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuthenticatedRestaurant = {
  id: string;
  slug: string;
  name: string;
  stamps_required: number;
  reward_text: string;
  logo_url: string | null;
  background_color: string;
  background_image_url: string | null;
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
    .select("id, slug, name, stamps_required, reward_text, logo_url, background_color, background_image_url")
    .eq("user_id", authedUser.id)
    .single();

  return restaurant ?? null;
}

export async function requireAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant> {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) throw new Error("Non authentifié ou aucun restaurant associé à ce compte");
  return restaurant;
}
