"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient("admin");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
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
