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

  if (!firstName || !lastName || !email) {
    return redirect(
      `/restaurant/clients/${id}?error=${encodeURIComponent("Nom, prénom et email sont obligatoires.")}`
    );
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ first_name: firstName, last_name: lastName, email, phone: phone || null })
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
