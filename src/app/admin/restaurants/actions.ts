"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletClassDesign } from "@/lib/google-wallet";
import { notifyApplePassUpdatesForRestaurant } from "@/lib/apple-wallet-push";

// The client-side `pattern` attribute on the slug field is trivially
// bypassed (JS-driven form fills, browsers that don't enforce it), so the
// slug must be normalized server-side too — otherwise spaces/accents/etc.
// end up in the public URL and QR code.
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Returns { url: null, error } instead of throwing on failure — a rejected
// upload (oversized file, wrong format, etc.) should not block creating or
// saving the rest of the restaurant's info, which previously discarded
// everything the admin had typed in.
async function uploadImageIfProvided(
  formData: FormData,
  fieldName: string,
  pathPrefix: string
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return { url: null, error: null };

  const ext = file.name.split(".").pop() || "png";
  const path = `${pathPrefix}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("restaurant-logos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) return { url: null, error: error.message };

  const { data } = supabaseAdmin.storage.from("restaurant-logos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function createRestaurant(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? ""));
  const category = String(formData.get("category") ?? "").trim();
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

  const logoResult = await uploadImageIfProvided(formData, "logo", `${slug}-logo`);
  const backgroundResult = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`);
  const logoUrl = logoResult.url;
  const backgroundImageUrl = backgroundResult.url;
  // A failed image upload (too large, wrong format, etc.) shouldn't discard
  // everything else the admin typed in — the restaurant is still created,
  // just without that image, and the issue is surfaced afterward instead.
  const uploadWarnings = [logoResult.error, backgroundResult.error].filter(
    (e): e is string => e !== null
  );

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

  const { data: created, error: insertError } = await supabaseAdmin
    .from("restaurants")
    .insert({
      slug,
      name,
      category: category || null,
      background_color: backgroundColor,
      background_image_url: backgroundImageUrl,
      stamps_required: stampsRequired,
      reward_text: rewardText,
      welcome_offer_text: welcomeOfferText || null,
      address: address || null,
      logo_url: logoUrl,
      user_id: authUser.user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    return redirect(`/admin/restaurants/new?error=${encodeURIComponent(insertError.message)}`);
  }

  if (uploadWarnings.length > 0) {
    return redirect(
      `/admin/restaurants/${created.id}?error=${encodeURIComponent(
        `Restaurant créé, mais l'upload a échoué pour : ${uploadWarnings.join(" ; ")}`
      )}`
    );
  }

  redirect("/admin");
}

export async function updateRestaurant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? ""));
  const category = String(formData.get("category") ?? "").trim();
  const backgroundColor = String(formData.get("backgroundColor") ?? "#27272a");
  const removeBackgroundImage = formData.get("removeBackgroundImage") === "on";
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !slug || !rewardText) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent("Champs obligatoires manquants.")}`
    );
  }

  const logoResult = await uploadImageIfProvided(formData, "logo", `${slug}-logo`);
  const backgroundResult = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`);
  const logoUrl = logoResult.url;
  const backgroundImageUrl = backgroundResult.url;
  const uploadWarnings = [logoResult.error, backgroundResult.error].filter(
    (e): e is string => e !== null
  );

  const update: Record<string, unknown> = {
    name,
    slug,
    category: category || null,
    background_color: backgroundColor,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
    address: address || null,
    // Lets the Apple Wallet push-update endpoint tell which already-saved
    // passes need refreshing (see apple-wallet-push.ts).
    updated_at: new Date().toISOString(),
  };
  if (logoUrl) update.logo_url = logoUrl;
  if (backgroundImageUrl) {
    update.background_image_url = backgroundImageUrl;
  } else if (removeBackgroundImage) {
    update.background_image_url = null;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("restaurants")
    .update(update)
    .eq("id", id)
    .select("name, background_color, background_image_url, logo_url")
    .single();

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  // Best-effort, non-blocking: pushes the design change to any Google/Apple
  // Wallet passes clients already saved for this restaurant.
  if (updated) {
    after(() =>
      updateGoogleWalletClassDesign({
        restaurantId: id,
        restaurantName: updated.name,
        backgroundColor: updated.background_color,
        backgroundImageUrl: updated.background_image_url,
        logoUrl: updated.logo_url,
      })
    );
    after(() => notifyApplePassUpdatesForRestaurant(id));
  }

  if (uploadWarnings.length > 0) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent(
        `Le reste a été enregistré, mais l'upload a échoué pour : ${uploadWarnings.join(" ; ")}`
      )}`
    );
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
