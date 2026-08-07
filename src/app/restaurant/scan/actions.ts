"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletStamps } from "@/lib/google-wallet";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

export async function lookupClient(clientId: string) {
  const restaurant = await requireAuthenticatedRestaurant();

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

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function recordVisit(clientId: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, stamps, total_visits, last_visit_at")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client introuvable pour ce restaurant." as const };
  }

  if (client.last_visit_at && isSameCalendarDay(new Date(client.last_visit_at), new Date())) {
    return {
      alreadyVisitedToday: true as const,
      clientName: client.first_name,
      stamps: client.stamps,
      stampsRequired: restaurant.stamps_required,
    };
  }

  const newStampCount = client.stamps + 1;
  const rewardEarned = newStampCount >= restaurant.stamps_required;
  const stampsAfter = rewardEarned ? 0 : newStampCount;

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({
      stamps: stampsAfter,
      total_visits: client.total_visits + 1,
      last_visit_at: new Date().toISOString(),
    })
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
    alreadyVisitedToday: false as const,
    clientName: client.first_name,
    stamps: stampsAfter,
    stampsRequired: restaurant.stamps_required,
    rewardEarned,
    rewardText: restaurant.reward_text,
  };
}
