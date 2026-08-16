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
  const civilite = String(formData.get("civilite") ?? "").trim();
  const dateNaissance = String(formData.get("dateNaissance") ?? "").trim();
  const adressePostale = String(formData.get("adressePostale") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const nationalite = String(formData.get("nationalite") ?? "").trim();
  const codeParrainage = String(formData.get("codeParrainage") ?? "").trim();

  // Only fields this restaurant's RGPD config actually collects are
  // required -- a field turned off must never block saving the rest of the
  // form, whether or not this client happens to already have a value there.
  const missingRequiredField =
    (restaurant.collect_first_name && !firstName) ||
    (restaurant.collect_last_name && !lastName) ||
    (restaurant.collect_email && !email) ||
    (restaurant.collect_city && !city);

  if (missingRequiredField) {
    return redirect(
      `/restaurant/clients/${id}?error=${encodeURIComponent("Certains champs obligatoires sont manquants.")}`
    );
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      city: city || null,
      // The 6 additional fields are never required, regardless of RGPD
      // config -- just store whatever was entered, or clear it.
      civilite: civilite || null,
      date_naissance: dateNaissance || null,
      adresse_postale: adressePostale || null,
      profession: profession || null,
      nationalite: nationalite || null,
      code_parrainage: codeParrainage || null,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return redirect(`/restaurant/clients/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/restaurant/clients/${id}?saved=1`);
}

// Free-text internal note, visible only to this client's own restaurant --
// never surfaced to the client, either wallet, or the QR code. Scoped by
// restaurant_id like every other client mutation here, so one restaurant can
// never read or overwrite another restaurant's client notes.
export async function updateClientNote(formData: FormData) {
  const restaurant = await requireAuthenticatedRestaurant();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("internalNote") ?? "").trim();

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ internal_note: note || null })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return redirect(`/restaurant/clients/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/restaurant/clients/${id}?noteSaved=1`);
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
