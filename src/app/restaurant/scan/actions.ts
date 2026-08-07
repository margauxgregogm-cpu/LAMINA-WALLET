"use server";

import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletStamps } from "@/lib/google-wallet";

async function getAuthenticatedRestaurant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Non authentifié");

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, stamps_required, reward_text")
    .eq("user_id", user.id)
    .single();

  if (!restaurant) throw new Error("Aucun restaurant associé à ce compte");

  return restaurant;
}

export async function lookupClient(clientId: string) {
  const restaurant = await getAuthenticatedRestaurant();

  const { data: client, error } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, email, stamps, is_vip, last_visit_at")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (error || !client) {
    return { error: "Client introuvable pour ce restaurant." as const };
  }

  return {
    client,
    stampsRequired: restaurant.stamps_required,
    rewardText: restaurant.reward_text,
  };
}

export async function recordVisit(clientId: string) {
  const restaurant = await getAuthenticatedRestaurant();

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, stamps")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client introuvable pour ce restaurant." as const };
  }

  const newStampCount = client.stamps + 1;
  const rewardEarned = newStampCount >= restaurant.stamps_required;
  const stampsAfter = rewardEarned ? 0 : newStampCount;

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ stamps: stampsAfter, last_visit_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabaseAdmin.from("visits").insert({
    client_id: clientId,
    restaurant_id: restaurant.id,
  });

  await updateGoogleWalletStamps({
    clientId,
    stamps: stampsAfter,
    stampsRequired: restaurant.stamps_required,
  });

  return {
    clientName: client.first_name,
    stamps: stampsAfter,
    stampsRequired: restaurant.stamps_required,
    rewardEarned,
    rewardText: restaurant.reward_text,
  };
}
