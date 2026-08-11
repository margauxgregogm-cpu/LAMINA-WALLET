"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

// Self-service password change for restaurant staff -- distinct from
// resetRestaurantPassword (src/app/admin/restaurants/actions.ts), which is
// the admin-driven reset using the service_role admin API. This one uses
// the restaurant's own session, matching the same write-only,
// no-current-password-shown convention.
export async function updateOwnPassword(formData: FormData) {
  await requireAuthenticatedRestaurant();

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 6) {
    return redirect(`/restaurant/parametres?error=${encodeURIComponent("6 caractères minimum.")}`);
  }

  const supabase = await createClient("restaurant");
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return redirect(`/restaurant/parametres?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/restaurant/parametres?passwordChanged=1");
}
