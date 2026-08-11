import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import {
  getPushPlan,
  currentPeriodKey,
  nextRenewalDate,
  type PushPlan,
} from "./push-plans";

export type PushQuotaStatus = {
  enabled: boolean;
  plan: PushPlan | null;
  limit: number;
  used: number;
  remaining: number;
  periodKey: string;
  renewalDate: Date | null;
  /** True only when the restaurant may actually send right now. */
  canSend: boolean;
};

const DISABLED: PushQuotaStatus = {
  enabled: false,
  plan: null,
  limit: 0,
  used: 0,
  remaining: 0,
  periodKey: "",
  renewalDate: null,
  canSend: false,
};

// Single source of truth for "where does this restaurant stand on its quota".
// Used by the entreprise page, the admin fiche, and the send action itself --
// so what an admin sees, what the restaurant sees, and what the server
// enforces can never drift apart.
export async function getPushQuotaStatus(restaurantId: string): Promise<PushQuotaStatus> {
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("push_notifications_enabled, push_plan")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) return DISABLED;

  const plan = getPushPlan(restaurant.push_plan);
  const enabled = Boolean(restaurant.push_notifications_enabled);

  // An admin can leave a plan attached while switching the feature off; the
  // plan details stay visible but nothing can be sent.
  if (!plan) {
    return { ...DISABLED, enabled };
  }

  const periodKey = currentPeriodKey(plan);
  const { count } = await supabaseAdmin
    .from("push_notifications")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("period_key", periodKey)
    .eq("status", "sent");

  const used = count ?? 0;
  const remaining = Math.max(0, plan.limit - used);

  return {
    enabled,
    plan,
    limit: plan.limit,
    used,
    remaining,
    periodKey,
    renewalDate: nextRenewalDate(plan),
    canSend: enabled && remaining > 0,
  };
}
