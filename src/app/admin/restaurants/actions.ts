"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function uploadImageIfProvided(
  formData: FormData,
  fieldName: string,
  pathPrefix: string
): Promise<string | null> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "png";
  const path = `${pathPrefix}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("restaurant-logos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Échec de l'upload de l'image : ${error.message}`);

  const { data } = supabaseAdmin.storage.from("restaurant-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createRestaurant(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const backgroundColor = String(formData.get("backgroundColor") ?? "#27272a");
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const loginEmail = String(formData.get("loginEmail") ?? "").trim();
  const loginPassword = String(formData.get("loginPassword") ?? "");

  if (!name || !slug || !rewardText || !loginEmail || !loginPassword) {
    return redirect(
      `/admin/restaurants/new?error=${encodeURIComponent("Champs obligatoires manquants.")}`
    );
  }

  let logoUrl: string | null;
  let backgroundImageUrl: string | null;
  try {
    logoUrl = await uploadImageIfProvided(formData, "logo", `${slug}-logo`);
    backgroundImageUrl = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`);
  } catch (err) {
    return redirect(`/admin/restaurants/new?error=${encodeURIComponent((err as Error).message)}`);
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: loginPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return redirect(
      `/admin/restaurants/new?error=${encodeURIComponent(authError?.message ?? "Erreur de création du compte")}`
    );
  }

  const { error: insertError } = await supabaseAdmin.from("restaurants").insert({
    slug,
    name,
    background_color: backgroundColor,
    background_image_url: backgroundImageUrl,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
    address: address || null,
    logo_url: logoUrl,
    user_id: authUser.user.id,
  });

  if (insertError) {
    return redirect(`/admin/restaurants/new?error=${encodeURIComponent(insertError.message)}`);
  }

  redirect("/admin");
}

export async function updateRestaurant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const backgroundColor = String(formData.get("backgroundColor") ?? "#27272a");
  const removeBackgroundImage = formData.get("removeBackgroundImage") === "on";
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  let logoUrl: string | null;
  let backgroundImageUrl: string | null;
  try {
    logoUrl = await uploadImageIfProvided(formData, "logo", `${slug}-logo`);
    backgroundImageUrl = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`);
  } catch (err) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent((err as Error).message)}`);
  }

  const update: Record<string, unknown> = {
    name,
    slug,
    background_color: backgroundColor,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
    address: address || null,
  };
  if (logoUrl) update.logo_url = logoUrl;
  if (backgroundImageUrl) {
    update.background_image_url = backgroundImageUrl;
  } else if (removeBackgroundImage) {
    update.background_image_url = null;
  }

  const { error } = await supabaseAdmin.from("restaurants").update(update).eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?saved=1`);
}

export async function resetRestaurantPassword(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!restaurant?.user_id) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent("Aucun compte de connexion associé à ce restaurant.")}`
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(restaurant.user_id, {
    password: newPassword,
  });

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?passwordReset=1`);
}

export async function deleteRestaurant(id: string) {
  await requireAdmin();

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("user_id")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (restaurant?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(restaurant.user_id);
  }

  redirect("/admin");
}
