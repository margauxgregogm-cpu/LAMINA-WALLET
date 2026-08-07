"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

export async function searchClients(query: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  // Strip characters with special meaning in PostgREST filter syntax so a
  // stray comma/parenthesis can't distort the .or() query.
  const trimmed = query.trim().replace(/[%,()]/g, "");
  if (!trimmed) return [];

  const { data } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, email, stamps, total_visits, is_vip, last_visit_at")
    .eq("restaurant_id", restaurant.id)
    .or(`first_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
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
