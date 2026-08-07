"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function loginRestaurant(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient("restaurant");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/restaurant/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/restaurant/scan");
}

export async function logoutRestaurant() {
  const supabase = await createClient("restaurant");
  await supabase.auth.signOut();
  redirect("/restaurant/login");
}
