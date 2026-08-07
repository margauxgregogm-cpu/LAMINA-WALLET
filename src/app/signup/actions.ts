"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function signupClient(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!restaurantId || !firstName || !email) {
    throw new Error("Missing required fields");
  }

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      restaurant_id: restaurantId,
      first_name: firstName,
      email,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("email", email)
        .single();
      if (existing) redirect(`/signup/success?id=${existing.id}`);
    }
    throw new Error(error.message);
  }

  redirect(`/signup/success?id=${data.id}`);
}
