"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function uploadLogoIfProvided(formData: FormData, slug: string): Promise<string | null> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "png";
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("restaurant-logos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Échec de l'upload du logo : ${error.message}`);

  const { data } = supabaseAdmin.storage.from("restaurant-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createRestaurant(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const colorTheme = String(formData.get("colorTheme") ?? "anthracite");
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const loginEmail = String(formData.get("loginEmail") ?? "").trim();
  const loginPassword = String(formData.get("loginPassword") ?? "");

  if (!name || !slug || !rewardText || !loginEmail || !loginPassword) {
    return redirect(
      `/admin/restaurants/new?error=${encodeURIComponent("Champs obligatoires manquants.")}`
    );
  }

  let logoUrl: string | null;
  try {
    logoUrl = await uploadLogoIfProvided(formData, slug);
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
    color_theme: colorTheme,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
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
  const colorTheme = String(formData.get("colorTheme") ?? "anthracite");
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();

  let logoUrl: string | null;
  try {
    logoUrl = await uploadLogoIfProvided(formData, slug);
  } catch (err) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent((err as Error).message)}`);
  }

  const update: Record<string, unknown> = {
    name,
    slug,
    color_theme: colorTheme,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
  };
  if (logoUrl) update.logo_url = logoUrl;

  const { error } = await supabaseAdmin.from("restaurants").update(update).eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?saved=1`);
}
