"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function searchClients(query: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  const trimmed = query.trim();
  if (!trimmed) return [];

  // A scanned/pasted client ID (from a QR code) looks like a UUID — look it
  // up directly rather than running it through the name/email search, which
  // would never match on an ID.
  if (UUID_PATTERN.test(trimmed)) {
    const { data } = await supabaseAdmin
      .from("clients")
      .select("id, first_name, email, stamps, total_visits, is_vip, last_visit_at")
      .eq("restaurant_id", restaurant.id)
      .eq("id", trimmed)
      .limit(1);

    return data ?? [];
  }

  // Strip characters with special meaning in PostgREST filter syntax so a
  // stray comma/parenthesis can't distort the .or() query.
  const sanitized = trimmed.replace(/[%,()]/g, "");
  if (!sanitized) return [];

  const { data } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, email, stamps, total_visits, is_vip, last_visit_at")
    .eq("restaurant_id", restaurant.id)
    .or(`first_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    .order("first_name")
    .limit(20);

  return data ?? [];
}

export async function toggleVip(clientId: string, isVip: boolean) {
  const restaurant = await requireAuthenticatedRestaurant();

  await supabaseAdmin
    .from("clients")
    .update({ is_vip: isVip })
    .eq("id", clientId)
    .eq("restaurant_id", restaurant.id);
}
