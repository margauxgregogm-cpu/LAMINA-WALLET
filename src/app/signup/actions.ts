"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function signupClient(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId") ?? "");
  const restaurantSlug = String(formData.get("restaurantSlug") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const commercialEmailConsent = formData.get("commercialEmailConsent") === "on";

  if (!restaurantId || !firstName || !lastName || !email || !city) {
    throw new Error("Missing required fields");
  }

  // Phone became mandatory for new clients: real number entered by the
  // client, never a fallback/placeholder. Existing clients created back
  // when it was optional are untouched -- this check only gates new rows.
  if (!phone) {
    redirect(
      `/signup?r=${encodeURIComponent(restaurantSlug)}&error=${encodeURIComponent(
        "Le numéro de téléphone est obligatoire pour créer votre carte."
      )}`
    );
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
      phone,
      city: city || null,
      stamps: initialStamps,
      total_visits: 1,
      last_visit_at: now,
      commercial_email_consent: commercialEmailConsent,
      commercial_email_consent_at: now,
      commercial_email_consent_source: "signup",
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
