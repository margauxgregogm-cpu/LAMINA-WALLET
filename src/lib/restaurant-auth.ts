import "server-only";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuthenticatedRestaurant = {
  id: string;
  name: string;
  stamps_required: number;
  reward_text: string;
};

export async function getAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, stamps_required, reward_text")
    .eq("user_id", user.id)
    .single();

  return restaurant ?? null;
}

export async function requireAuthenticatedRestaurant(): Promise<AuthenticatedRestaurant> {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) throw new Error("Non authentifié ou aucun restaurant associé à ce compte");
  return restaurant;
}
