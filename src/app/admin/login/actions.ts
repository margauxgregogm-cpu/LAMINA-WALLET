"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!(await isAdmin())) {
    await supabase.auth.signOut();
    redirect(`/admin/login?error=${encodeURIComponent("Ce compte n'a pas accès à l'admin.")}`);
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
