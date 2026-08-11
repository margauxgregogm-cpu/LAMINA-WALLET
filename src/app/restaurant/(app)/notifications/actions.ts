"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPushQuotaStatus } from "@/lib/push-quota";
import { currentPeriodKey, PUSH_MESSAGE_MAX_LENGTH } from "@/lib/push-plans";
import { notifyApplePassUpdatesForRestaurant } from "@/lib/apple-wallet-push";

function fail(message: string): never {
  redirect(`/restaurant/notifications?error=${encodeURIComponent(message)}`);
}

export async function sendPushNotification(formData: FormData) {
  // The restaurant is taken from the session, never from the form -- a
  // crafted request cannot target another restaurant's clients.
  const restaurant = await requireAuthenticatedRestaurant();

  const message = String(formData.get("message") ?? "").trim();
  if (!message) fail("Le message ne peut pas être vide.");
  if (message.length > PUSH_MESSAGE_MAX_LENGTH) {
    fail(`Le message dépasse ${PUSH_MESSAGE_MAX_LENGTH} caractères.`);
  }

  // Re-read the plan server-side rather than trusting anything rendered
  // earlier: an admin may have switched the option off or changed the plan
  // since the page loaded.
  const status = await getPushQuotaStatus(restaurant.id);
  if (!status.enabled || !status.plan) {
    fail("Les notifications push ne sont pas activées pour votre établissement.");
  }
  if (status.remaining <= 0) {
    fail("Vous avez utilisé toutes les notifications disponibles dans votre forfait.");
  }

  // The real gate. consume_push_quota (migration 011) locks the restaurant
  // row, re-counts inside the transaction and inserts only if there is room,
  // so two simultaneous requests can never both get the last notification.
  // The checks above are for good error messages; this is what enforces.
  const { data: notificationId, error } = await supabaseAdmin.rpc("consume_push_quota", {
    p_restaurant_id: restaurant.id,
    p_message: message,
    p_period_key: currentPeriodKey(status.plan),
    p_limit: status.plan.limit,
  });

  if (error) {
    console.error("Push quota consumption failed:", error);
    fail("Envoi impossible pour le moment. Réessayez dans un instant.");
  }
  if (!notificationId) {
    fail("Vous avez utilisé toutes les notifications disponibles dans votre forfait.");
  }

  // Put the message on the card BEFORE pushing, and wait for it: the push
  // just tells devices "go re-fetch your pass", and the notification only
  // appears if that re-fetch sees this field's value change (see migration
  // 012_wallet_announcement.sql). Pushing first would race the write.
  // updated_at also has to move: it's what the PassKit web-service routes
  // use to decide "has this pass changed" (both the changed-passes list and
  // the If-Modified-Since check), and a plain column update doesn't bump it
  // on its own -- an announcement-only send was invisible to both.
  const { error: announceError } = await supabaseAdmin
    .from("restaurants")
    .update({ wallet_announcement: message, updated_at: new Date().toISOString() })
    .eq("id", restaurant.id);
  if (announceError) {
    // The send is already recorded and charged to the quota -- surfacing
    // this as a failure would let the restaurant retry and spend a second
    // notification for what the card will still pick up on its own next
    // fetch. Log it and let the push attempt below carry the value again.
    console.error("Failed to write wallet_announcement:", announceError);
  }

  // Delivery is best-effort and non-blocking: the quota is already spent and
  // the send recorded, so a slow APNs round-trip must not hold up the form.
  // Reuses the existing Apple Wallet push path, which is already scoped to
  // this restaurant's registrations -- no new wallet plumbing, and pass
  // generation is untouched.
  after(async () => {
    try {
      const { count } = await supabaseAdmin
        .from("apple_wallet_registrations")
        .select("id", { count: "exact", head: true })
        .like("serial_number", `${restaurant.id}-%`);

      await notifyApplePassUpdatesForRestaurant(restaurant.id);

      await supabaseAdmin
        .from("push_notifications")
        .update({ recipients_count: count ?? 0 })
        .eq("id", notificationId);
    } catch (err) {
      console.error("Push delivery error:", err);
    }
  });

  redirect("/restaurant/notifications?sent=1");
}
