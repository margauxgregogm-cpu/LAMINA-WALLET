import "server-only";
import { supabaseAdmin } from "./supabase-admin";

// Small, reusable aggregate-count helpers for the entreprise dashboard and
// stats page. Each does a single `head: true, count: "exact"` Supabase
// query (no rows fetched, just the count) so these stay cheap to call
// alongside a page's other data-fetching.

export async function getClientsCount(restaurantId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);
  return count ?? 0;
}

export async function getVisitsCountInRange(
  restaurantId: string,
  from: Date,
  to?: Date
): Promise<number> {
  let query = supabaseAdmin
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .gte("created_at", from.toISOString());
  if (to) query = query.lt("created_at", to.toISOString());
  const { count } = await query;
  return count ?? 0;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

