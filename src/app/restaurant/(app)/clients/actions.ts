"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedRestaurant } from "@/lib/restaurant-auth";

export async function updateClient(formData: FormData) {
  const restaurant = await requireAuthenticatedRestaurant();

  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!firstName || !lastName || !email || !city) {
    return redirect(
      `/restaurant/clients/${id}?error=${encodeURIComponent("Nom, prénom, email et ville sont obligatoires.")}`
    );
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      city,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return redirect(`/restaurant/clients/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/restaurant/clients/${id}?saved=1`);
}

export async function deleteClient(id: string) {
  const restaurant = await requireAuthenticatedRestaurant();

  await supabaseAdmin.from("clients").delete().eq("id", id).eq("restaurant_id", restaurant.id);

  redirect("/restaurant");
}

// Lets the restaurant flip a client's marketing opt-in when the client
// tells them directly (in person, by phone, etc.) instead of through the
// signup form. This is the CURRENT status: exports always read this value,
// not whatever was chosen at signup.
export async function updateCommercialConsent(id: string, nextValue: boolean) {
  const restaurant = await requireAuthenticatedRestaurant();

  await supabaseAdmin
    .from("clients")
    .update({
      commercial_email_consent: nextValue,
      commercial_email_consent_at: new Date().toISOString(),
      commercial_email_consent_source: "restaurant",
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  redirect(`/restaurant/clients/${id}?saved=1`);
}
