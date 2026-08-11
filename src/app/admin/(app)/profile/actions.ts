"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// Self-service password change for the admin's own account -- mirrors
// resetRestaurantPassword's write-only, no-current-password-shown
// convention, but uses the admin's own session (auth.updateUser) rather
// than the service_role admin API used to reset a restaurant's password.
export async function updateOwnAdminPassword(formData: FormData) {
  await requireAdmin();

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 6) {
    return redirect(`/admin/profile?error=${encodeURIComponent("6 caractères minimum.")}`);
  }

  const supabase = await createClient("admin");
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return redirect(`/admin/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/profile?passwordChanged=1");
}
