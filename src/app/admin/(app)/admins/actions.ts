"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeIdentifier(input: string): string {
  return input.trim().toLowerCase();
}

// Renaming an admin's login identifier never touches the Supabase Auth
// user, its email or its password -- mirrors updateRestaurantIdentifier in
// admin/(app)/restaurants/actions.ts. It only writes the separate
// `login_identifier` column that loginAdmin() resolves at sign-in time.
export async function updateAdminIdentifier(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const loginIdentifier = String(formData.get("loginIdentifier") ?? "").trim();

  if (!loginIdentifier) {
    return redirect(`/admin/admins?error=${encodeURIComponent("Identifiant requis.")}`);
  }

  const { data: clash } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("login_identifier_normalized", normalizeIdentifier(loginIdentifier))
    .neq("id", id)
    .maybeSingle();

  if (clash) {
    return redirect(
      `/admin/admins?error=${encodeURIComponent("Cet identifiant de connexion est déjà utilisé.")}`
    );
  }

  const { error } = await supabaseAdmin
    .from("admins")
    .update({ login_identifier: loginIdentifier })
    .eq("id", id);

  if (error) {
    return redirect(`/admin/admins?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/admins?identifierUpdated=1");
}
