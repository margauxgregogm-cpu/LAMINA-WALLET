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

export async function getVipCount(restaurantId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("is_vip", true);
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

export function startOfWeek(date: Date): Date {
  // Monday-based week start, matching French convention.
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Buckets visit timestamps into the last `weeks` Monday-starting weeks
// (oldest first), for a simple week-by-week visit count -- no charting
// library, just real counts the page renders as a bar/list.
export async function getWeeklyVisitCounts(
  restaurantId: string,
  weeks: number
): Promise<{ weekStart: Date; count: number }[]> {
  const now = new Date();
  const earliestWeekStart = startOfWeek(now);
  earliestWeekStart.setDate(earliestWeekStart.getDate() - 7 * (weeks - 1));

  const { data } = await supabaseAdmin
    .from("visits")
    .select("created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", earliestWeekStart.toISOString());

  const buckets: { weekStart: Date; count: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(earliestWeekStart);
    weekStart.setDate(weekStart.getDate() + 7 * i);
    buckets.push({ weekStart, count: 0 });
  }

  for (const visit of data ?? []) {
    const visitWeekStart = startOfWeek(new Date(visit.created_at)).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === visitWeekStart);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

// Number of distinct clients who visited since `from` -- dataset is
// already scoped to one restaurant, so deduping in JS is cheap and avoids
// a second round-trip for a DISTINCT query Supabase's client doesn't
// expose directly.
export async function getActiveClientsCountSince(restaurantId: string, from: Date): Promise<number> {
  const { data } = await supabaseAdmin
    .from("visits")
    .select("client_id")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", from.toISOString());
  return new Set((data ?? []).map((v) => v.client_id)).size;
}
