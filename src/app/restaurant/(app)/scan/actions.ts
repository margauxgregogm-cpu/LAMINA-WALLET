"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletStamps } from "@/lib/google-wallet";
import { notifyApplePassUpdate } from "@/lib/apple-wallet-push";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

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

  // RGPD field config can leave first_name/last_name unset for this
  // restaurant -- never surface an empty or "null" name in the scan overlay.
  const clientName = client.first_name || client.last_name || "Client";
  const clientFullName =
    [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";

  if (client.last_visit_at && isSameCalendarDay(new Date(client.last_visit_at), new Date())) {
    return {
      alreadyVisitedToday: true as const,
      clientId: client.id,
      clientName,
      clientFullName,
      stamps: client.stamps,
      stampsRequired: restaurant.stamps_required,
      rewardText: restaurant.reward_text,
    };
  }

  // A restaurant configured with stampsRequired = 0 has no stamp program at
  // all -- the visit (and the "1 passage/jour" gate above, and the history
  // below) still record normally, but there's no threshold to increment
  // towards or reward to trigger, so `clients.stamps` is left untouched
  // rather than incremented against a zero ceiling.
  const hasStampProgram = restaurant.stamps_required > 0;
  const newStampCount = hasStampProgram ? client.stamps + 1 : client.stamps;
  const rewardEarned = hasStampProgram && newStampCount >= restaurant.stamps_required;
  const stampsAfter = hasStampProgram ? (rewardEarned ? 0 : newStampCount) : client.stamps;

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({
      ...(hasStampProgram ? { stamps: stampsAfter } : {}),
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

  // Don't block the response on Google's/Apple's APIs — these are
  // best-effort syncs and the external round-trips they make were the main
  // source of perceived click lag on the scan action.
  after(() =>
    updateGoogleWalletStamps({
      clientId,
      stamps: stampsAfter,
      stampsRequired: restaurant.stamps_required,
      rewardText: restaurant.reward_text,
    })
  );
  after(() => notifyApplePassUpdate({ restaurantId: restaurant.id, clientId }));

  return {
    alreadyVisitedToday: false as const,
    clientId: client.id,
    clientName,
    clientFullName,
    stamps: stampsAfter,
    stampsRequired: restaurant.stamps_required,
    rewardEarned,
    rewardText: restaurant.reward_text,
  };
}
