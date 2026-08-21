"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletStamps } from "@/lib/google-wallet";
import { notifyApplePassUpdate } from "@/lib/apple-wallet-push";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

// Manual stamp adjustments (gestion libre ON) are corrections, not physical
// visits -- unlike recordVisit() (see ../scan/actions.ts) they never touch
// `visits`, `total_visits`, or `last_visit_at`, so they can't skew the
// visit-frequency panel, the dashboard KPIs, or the "1 passage/jour" gate,
// which stays scoped to real scans/recherche exactly as before.

type Failure = { ok: false; error: string };

function fail(error: string): Failure {
  return { ok: false, error };
}

function parseQuantity(raw: number): { ok: true; value: number } | Failure {
  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw <= 0) {
    return fail("Merci d'indiquer un nombre entier de tampons supérieur à 0.");
  }
  return { ok: true, value: raw };
}

// Multiple reward cycles in a single free-quantity operation (e.g. objectif
// 10, client à 3, +27 -> 30) earn several rewards and keep the remainder,
// unlike the fixed +1 scan/recherche flow which can only ever cross the
// threshold by at most one stamp and simply resets to 0.
function applyCycles(current: number, delta: number, stampsRequired: number) {
  // stampsRequired = 0 has no cycle threshold to divide/modulo against --
  // guarded defensively even though the admin UI won't normally combine
  // "gestion libre" with a 0-stamp program (see migration
  // 021_stamp_display_style.sql / scan/actions.ts for the primary 0-stamp
  // handling on the regular scan path).
  if (stampsRequired <= 0) {
    return { stampsAfter: current + delta, cyclesEarned: 0 };
  }
  const newTotal = current + delta;
  const cyclesEarned = Math.floor(newTotal / stampsRequired);
  const stampsAfter = newTotal % stampsRequired;
  return { stampsAfter, cyclesEarned };
}

async function loadClientAndRestaurantForAdjustment(
  clientId: string
): Promise<
  | Failure
  | {
      ok: true;
      restaurantId: string;
      stampsRequired: number;
      rewardText: string;
      clientStamps: number;
      clientFirstName: string | null;
      clientLastName: string | null;
    }
> {
  const restaurant = await requireAuthenticatedRestaurant();

  if (!restaurant.free_stamp_management) {
    // Server-side gate: an OFF restaurant must never be able to reach this
    // logic, even via a crafted request bypassing the frontend entirely.
    return fail("La gestion libre des tampons n'est pas activée pour cette entreprise.");
  }

  const { data: client, error: fetchError } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, stamps")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (fetchError || !client) {
    return fail("Client introuvable pour ce restaurant.");
  }

  return {
    ok: true,
    restaurantId: restaurant.id,
    stampsRequired: restaurant.stamps_required,
    rewardText: restaurant.reward_text,
    clientStamps: client.stamps as number,
    clientFirstName: client.first_name as string | null,
    clientLastName: client.last_name as string | null,
  };
}

async function syncWalletsAndAudit({
  restaurantId,
  clientId,
  delta,
  stampsBefore,
  stampsAfter,
  stampsRequired,
  rewardText,
}: {
  restaurantId: string;
  clientId: string;
  delta: number;
  stampsBefore: number;
  stampsAfter: number;
  stampsRequired: number;
  rewardText: string;
}) {
  await supabaseAdmin.from("stamp_adjustments").insert({
    client_id: clientId,
    restaurant_id: restaurantId,
    delta,
    stamps_before: stampsBefore,
    stamps_after: stampsAfter,
  });

  after(() =>
    updateGoogleWalletStamps({ clientId, stamps: stampsAfter, stampsRequired, rewardText })
  );
  after(() => notifyApplePassUpdate({ restaurantId, clientId }));
}

export async function addStampsFreely(clientId: string, quantity: number) {
  const context = await loadClientAndRestaurantForAdjustment(clientId);
  if (!context.ok) return context;

  const parsed = parseQuantity(quantity);
  if (!parsed.ok) return parsed;

  const { stampsAfter, cyclesEarned } = applyCycles(
    context.clientStamps,
    parsed.value,
    context.stampsRequired
  );

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ stamps: stampsAfter, stamps_updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) return fail(updateError.message);

  await syncWalletsAndAudit({
    restaurantId: context.restaurantId,
    clientId,
    delta: parsed.value,
    stampsBefore: context.clientStamps,
    stampsAfter,
    stampsRequired: context.stampsRequired,
    rewardText: context.rewardText,
  });

  const clientFullName =
    [context.clientFirstName, context.clientLastName].filter(Boolean).join(" ") || "Client";

  return {
    ok: true as const,
    clientFullName,
    quantity: parsed.value,
    stampsBefore: context.clientStamps,
    stampsAfter,
    stampsRequired: context.stampsRequired,
    cyclesEarned,
    rewardText: context.rewardText,
  };
}

export async function removeStampsFreely(clientId: string, quantity: number) {
  const context = await loadClientAndRestaurantForAdjustment(clientId);
  if (!context.ok) return context;

  const parsed = parseQuantity(quantity);
  if (!parsed.ok) return parsed;

  // Never allowed to go below zero -- refused outright rather than clamped,
  // so the entreprise sees exactly why nothing happened.
  if (parsed.value > context.clientStamps) {
    return fail(
      `Impossible de retirer ${parsed.value} tampon(s) : ce client n'en a que ${context.clientStamps}.`
    );
  }

  const stampsAfter = context.clientStamps - parsed.value;

  const { error: updateError } = await supabaseAdmin
    .from("clients")
    .update({ stamps: stampsAfter, stamps_updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) return fail(updateError.message);

  await syncWalletsAndAudit({
    restaurantId: context.restaurantId,
    clientId,
    delta: -parsed.value,
    stampsBefore: context.clientStamps,
    stampsAfter,
    stampsRequired: context.stampsRequired,
    rewardText: context.rewardText,
  });

  const clientFullName =
    [context.clientFirstName, context.clientLastName].filter(Boolean).join(" ") || "Client";

  return {
    ok: true as const,
    clientFullName,
    quantity: parsed.value,
    stampsBefore: context.clientStamps,
    stampsAfter,
    stampsRequired: context.stampsRequired,
    // No cycle logic on retrait -- always 0, kept here only so callers that
    // handle both addStampsFreely and removeStampsFreely results (see
    // AddStampButton.tsx) can read a uniform shape.
    cyclesEarned: 0,
    rewardText: context.rewardText,
  };
}

// Step 1 of the gestion-libre scan flow: identifies the client without
// attributing anything yet, so the entreprise can pick a quantity before any
// write happens (see ScanClient.tsx). Read-only -- safe to call regardless
// of free_stamp_management, but only used from that flow.
export async function getClientForScan(clientId: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  const { data: client, error } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, stamps")
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (error || !client) {
    return fail("Client introuvable pour ce restaurant.");
  }

  const clientFullName =
    [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";

  return {
    ok: true as const,
    clientId: client.id as string,
    clientFullName,
    stamps: client.stamps as number,
    stampsRequired: restaurant.stamps_required,
    rewardText: restaurant.reward_text,
  };
}
