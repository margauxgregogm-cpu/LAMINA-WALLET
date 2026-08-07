"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletStamps } from "@/lib/google-wallet";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

export async function lookupClient(clientId: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  const { data: client, error } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, email, stamps, is_vip, last_visit_at")
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

// Vercel's serverless functions run in UTC, so comparing calendar days with
// plain Date getters resets the 1-stamp-per-day cap at UTC midnight — 1-2h
// after actual French midnight depending on DST. Compare the calendar date
// as seen in Europe/Paris instead, so a client can rescan right at midnight.
const PARIS_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function isSameCalendarDay(a: Date, b: Date) {
  return PARIS_DAY_FORMAT.format(a) === PARIS_DAY_FORMAT.format(b);
}

export async function recordVisit(clientId: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, stamps, total_visits, last_visit_at")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client introuvable pour ce restaurant." as const };
  }

  if (client.last_visit_at && isSameCalendarDay(new Date(client.last_visit_at), new Date())) {
    return {
      alreadyVisitedToday: true as const,
      clientId: client.id,
      clientName: client.first_name,
      clientFullName: `${client.first_name} ${client.last_name ?? ""}`.trim(),
      stamps: client.stamps,
      stampsRequired: restaurant.stamps_required,
      rewardText: restaurant.reward_text,
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

  // Don't block the response on Google's API — this is a best-effort sync
  // (see updateGoogleWalletStamps) and the two external round-trips it makes
  // were the main source of perceived click lag on the scan action.
  after(() =>
    updateGoogleWalletStamps({
      clientId,
      stamps: stampsAfter,
      stampsRequired: restaurant.stamps_required,
      rewardText: restaurant.reward_text,
    })
  );

  return {
    alreadyVisitedToday: false as const,
    clientId: client.id,
    clientName: client.first_name,
    clientFullName: `${client.first_name} ${client.last_name ?? ""}`.trim(),
    stamps: stampsAfter,
    stampsRequired: restaurant.stamps_required,
    rewardEarned,
    rewardText: restaurant.reward_text,
  };
}
