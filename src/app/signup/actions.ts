"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function signupClient(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!restaurantId || !firstName || !lastName || !email) {
    throw new Error("Missing required fields");
  }

  // The client is signing up in person at the restaurant, so this first
  // visit is real -- grant the first stamp immediately instead of making
  // the restaurant scan them again right after they just filled the form.
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("stamps_required")
    .eq("id", restaurantId)
    .single();

  const stampsRequired = restaurant?.stamps_required ?? 8;
  const rewardEarned = 1 >= stampsRequired;
  const initialStamps = rewardEarned ? 0 : 1;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      restaurant_id: restaurantId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      stamps: initialStamps,
      total_visits: 1,
      last_visit_at: now,
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

  await supabaseAdmin.from("visits").insert({
    client_id: data.id,
    restaurant_id: restaurantId,
  });

  redirect(`/signup/success?id=${data.id}`);
}
