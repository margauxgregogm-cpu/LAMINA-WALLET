"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

// Generic on purpose -- see the matching comment in restaurant/login/actions.ts:
// an identifier-specific error would let someone enumerate which identifiers exist.
const INVALID_CREDENTIALS_ERROR = "Identifiant ou mot de passe incorrect.";

export async function loginAdmin(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const normalizedIdentifier = identifier.toLowerCase();

  // The identifier is a plain admins column, resolved with the service_role
  // client (never exposed to the browser) into the Supabase Auth user's
  // actual, unchanged email -- signInWithPassword below still runs against
  // the exact same Auth user, password and session as before the identifier
  // existed. Mirrors loginRestaurant in restaurant/login/actions.ts.
  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("login_identifier_normalized", normalizedIdentifier)
    .maybeSingle();

  if (!admin?.user_id) {
    redirect(`/admin/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
  const email = authUser?.user?.email;

  if (!email) {
    redirect(`/admin/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  const supabase = await createClient("admin");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  if (!(await isAdmin())) {
    // Only drop the session this failed attempt just created. With the
    // default "global" scope, mistyping a restaurant account here signed
    // that account out of every device it was using, including the tills.
    await supabase.auth.signOut({ scope: "local" });
    redirect(`/admin/login?error=${encodeURIComponent("Ce compte n'a pas accès à l'admin.")}`);
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createClient("admin");
  // Same reasoning as the restaurant logout: end this device's session only.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}
