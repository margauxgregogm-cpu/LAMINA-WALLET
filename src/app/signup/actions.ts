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
  const civilite = String(formData.get("civilite") ?? "").trim();
  const dateNaissance = String(formData.get("dateNaissance") ?? "").trim();
  const adressePostale = String(formData.get("adressePostale") ?? "").trim();
  const profession = String(formData.get("profession") ?? "").trim();
  const nationalite = String(formData.get("nationalite") ?? "").trim();
  const codeParrainage = String(formData.get("codeParrainage") ?? "").trim();

  if (!restaurantId) {
    throw new Error("Missing required fields");
  }

  // The client is signing up in person at the restaurant, so this first
  // visit is real -- grant the first stamp immediately instead of making
  // the restaurant scan them again right after they just filled the form.
  //
  // Also the source of truth for which of the 11 fields this restaurant
  // actually collects (RGPD config) -- re-read here rather than trusting
  // which inputs the client happened to submit, so a tampered request can't
  // force a field this restaurant turned off to become required or stored.
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select(
      "stamps_required, collect_first_name, collect_last_name, collect_phone, collect_email, collect_city, collect_civilite, collect_date_naissance, collect_adresse_postale, collect_profession, collect_nationalite, collect_code_parrainage"
    )
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    throw new Error("Restaurant introuvable");
  }

  const collectFirstName = restaurant.collect_first_name ?? true;
  const collectLastName = restaurant.collect_last_name ?? true;
  const collectPhone = restaurant.collect_phone ?? true;
  const collectEmail = restaurant.collect_email ?? true;
  const collectCity = restaurant.collect_city ?? true;
  // The 6 additional fields are always optional (never required), even
  // when collected -- see collectCivilite... below, no presence check for
  // any of them.
  const collectCivilite = restaurant.collect_civilite ?? false;
  const collectDateNaissance = restaurant.collect_date_naissance ?? false;
  const collectAdressePostale = restaurant.collect_adresse_postale ?? false;
  const collectProfession = restaurant.collect_profession ?? false;
  const collectNationalite = restaurant.collect_nationalite ?? false;
  const collectCodeParrainage = restaurant.collect_code_parrainage ?? false;

  if (
    (collectFirstName && !firstName) ||
    (collectLastName && !lastName) ||
    (collectEmail && !email) ||
    (collectCity && !city)
  ) {
    throw new Error("Missing required fields");
  }

  // Phone became mandatory for new clients (when collected): real number
  // entered by the client, never a fallback/placeholder. Existing clients
  // created back when it was optional are untouched -- this check only
  // gates new rows, and only when this restaurant collects phone at all.
  if (collectPhone && !phone) {
    redirect(
      `/signup?r=${encodeURIComponent(restaurantSlug)}&error=${encodeURIComponent(
        "Le numéro de téléphone est obligatoire pour créer votre carte."
      )}`
    );
  }

  const stampsRequired = restaurant.stamps_required ?? 8;
  const rewardEarned = 1 >= stampsRequired;
  const initialStamps = rewardEarned ? 0 : 1;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      restaurant_id: restaurantId,
      first_name: collectFirstName ? firstName : null,
      last_name: collectLastName ? lastName || null : null,
      email: collectEmail ? email : null,
      phone: collectPhone ? phone : null,
      city: collectCity ? city || null : null,
      civilite: collectCivilite ? civilite || null : null,
      date_naissance: collectDateNaissance ? dateNaissance || null : null,
      adresse_postale: collectAdressePostale ? adressePostale || null : null,
      profession: collectProfession ? profession || null : null,
      nationalite: collectNationalite ? nationalite || null : null,
      code_parrainage: collectCodeParrainage ? codeParrainage || null : null,
      stamps: initialStamps,
      total_visits: 1,
      last_visit_at: now,
      commercial_email_consent: collectEmail ? commercialEmailConsent : false,
      commercial_email_consent_at: collectEmail ? now : null,
      commercial_email_consent_source: collectEmail ? "signup" : null,
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
