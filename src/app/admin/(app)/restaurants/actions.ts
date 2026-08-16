"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateGoogleWalletClassDesign, updateGoogleWalletRewardTextForRestaurant } from "@/lib/google-wallet";
import { notifyApplePassUpdatesForRestaurant } from "@/lib/apple-wallet-push";
import { getPushPlan } from "@/lib/push-plans";

// The client-side `pattern` attribute on the slug field is trivially
// bypassed (JS-driven form fills, browsers that don't enforce it), so the
// slug must be normalized server-side too — otherwise spaces/accents/etc.
// end up in the public URL and QR code.
function normalizeIdentifier(input: string): string {
  return input.trim().toLowerCase();
}

// Supabase Auth still requires an email on every user under the hood, but
// the entreprise login is now by identifier only -- this technical address
// is never shown to the restaurant and never asked of the admin either, it
// only exists to satisfy that internal requirement. Random, so it can never
// collide with another restaurant's.
function generateTechnicalEmail(): string {
  return `${randomUUID()}@users.laminacards.internal`;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Uploaded logos/backgrounds are raw phone-camera photos (often several MB,
// several thousand pixels wide) with nothing downstream ever needing that
// much resolution -- the Apple Wallet strip is drawn at 1125px wide, the
// biggest on-screen use is a full-bleed card background. Downscaling and
// re-encoding keeps them visually indistinguishable at every size they're
// actually displayed at while cutting the file (and therefore the .pkpass
// that embeds it) down drastically. PNG only when the source has an alpha
// channel (most logos) since that's the only reason to pay PNG's much
// larger size over JPEG.
async function compressImage(
  buffer: Buffer,
  maxDimension: number
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const resized = image.resize({
    width: maxDimension,
    height: maxDimension,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (metadata.hasAlpha) {
    return {
      buffer: await resized.png({ quality: 85, compressionLevel: 9 }).toBuffer(),
      contentType: "image/png",
      ext: "png",
    };
  }

  return {
    buffer: await resized.jpeg({ quality: 85, mozjpeg: true }).toBuffer(),
    contentType: "image/jpeg",
    ext: "jpg",
  };
}

// Returns { url: null, error } instead of throwing on failure — a rejected
// upload (oversized file, wrong format, etc.) should not block creating or
// saving the rest of the restaurant's info, which previously discarded
// everything the admin had typed in.
async function uploadImageIfProvided(
  formData: FormData,
  fieldName: string,
  pathPrefix: string,
  maxDimension: number
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return { url: null, error: null };

  let toUpload: { buffer: Buffer; contentType: string; ext: string };
  try {
    const original = Buffer.from(await file.arrayBuffer());
    toUpload = await compressImage(original, maxDimension);
  } catch {
    // Not an image sharp can decode, or some other processing failure --
    // fall back to uploading the original rather than losing the file.
    const ext = file.name.split(".").pop() || "png";
    toUpload = { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type, ext };
  }

  const path = `${pathPrefix}-${Date.now()}.${toUpload.ext}`;

  const { error } = await supabaseAdmin.storage
    .from("restaurant-logos")
    .upload(path, toUpload.buffer, { contentType: toUpload.contentType, upsert: true });

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
  // Apple Wallet only (foregroundColor + labelColor, see apple-wallet.ts) --
  // Google Wallet's Loyalty Class/Object API has no per-field text color.
  const walletTextColor = String(formData.get("walletTextColor") ?? "#000000");
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const loginIdentifier = String(formData.get("loginIdentifier") ?? "").trim();
  const loginPassword = String(formData.get("loginPassword") ?? "");
  // Entreprise-app interface theming — independent of backgroundColor above
  // (the loyalty card's own color, synced to Apple/Google Wallet). These 3
  // are UI-only and never sent to either wallet.
  const interfaceThemeColor = String(formData.get("interfaceThemeColor") ?? "#059669");
  const interfaceTextColor = String(formData.get("interfaceTextColor") ?? "#18181b");
  const interfaceCardColor = String(formData.get("interfaceCardColor") ?? "#ffffff");

  if (!name || !slug || !rewardText || !loginIdentifier || !loginPassword) {
    return redirect(
      `/admin/restaurants/new?error=${encodeURIComponent("Champs obligatoires manquants.")}`
    );
  }

  const { data: identifierClash } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("login_identifier_normalized", normalizeIdentifier(loginIdentifier))
    .maybeSingle();

  if (identifierClash) {
    return redirect(
      `/admin/restaurants/new?error=${encodeURIComponent("Cet identifiant de connexion est déjà utilisé.")}`
    );
  }

  const logoResult = await uploadImageIfProvided(formData, "logo", `${slug}-logo`, 800);
  const backgroundResult = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`, 1600);
  const logoUrl = logoResult.url;
  const backgroundImageUrl = backgroundResult.url;
  // A failed image upload (too large, wrong format, etc.) shouldn't discard
  // everything else the admin typed in — the restaurant is still created,
  // just without that image, and the issue is surfaced afterward instead.
  const uploadWarnings = [logoResult.error, backgroundResult.error].filter(
    (e): e is string => e !== null
  );

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: generateTechnicalEmail(),
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
      wallet_text_color: walletTextColor,
      background_image_url: backgroundImageUrl,
      stamps_required: stampsRequired,
      reward_text: rewardText,
      welcome_offer_text: welcomeOfferText || null,
      address: address || null,
      logo_url: logoUrl,
      user_id: authUser.user.id,
      login_identifier: loginIdentifier,
      interface_theme_color: interfaceThemeColor,
      interface_text_color: interfaceTextColor,
      interface_card_color: interfaceCardColor,
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
  // Apple Wallet only (foregroundColor + labelColor, see apple-wallet.ts) --
  // Google Wallet's Loyalty Class/Object API has no per-field text color.
  const walletTextColor = String(formData.get("walletTextColor") ?? "#000000");
  const removeBackgroundImage = formData.get("removeBackgroundImage") === "on";
  const stampsRequired = Number(formData.get("stampsRequired") ?? 8);
  const rewardText = String(formData.get("rewardText") ?? "").trim();
  const welcomeOfferText = String(formData.get("welcomeOfferText") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const interfaceThemeColor = String(formData.get("interfaceThemeColor") ?? "#059669");
  const interfaceTextColor = String(formData.get("interfaceTextColor") ?? "#18181b");
  const interfaceCardColor = String(formData.get("interfaceCardColor") ?? "#ffffff");

  if (!name || !slug || !rewardText) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent("Champs obligatoires manquants.")}`
    );
  }

  const logoResult = await uploadImageIfProvided(formData, "logo", `${slug}-logo`, 800);
  const backgroundResult = await uploadImageIfProvided(formData, "backgroundImage", `${slug}-bg`, 1600);
  const logoUrl = logoResult.url;
  const backgroundImageUrl = backgroundResult.url;
  const uploadWarnings = [logoResult.error, backgroundResult.error].filter(
    (e): e is string => e !== null
  );

  // Read before writing so the Apple Wallet push below can be skipped when
  // nothing the pass actually renders has changed -- e.g. an admin editing
  // only `category`/`address`/the interface theme colors (none of which
  // reach buildAppleWalletPass, see apple-wallet.ts), or just re-submitting
  // the form unchanged. Previously this endpoint always bumped `updated_at`
  // and always pushed every registered device of the restaurant on every
  // save, which is a real source of the kind of repeated no-op updates that
  // trigger Apple's "some passes are receiving too many updates" warning.
  const { data: before } = await supabaseAdmin
    .from("restaurants")
    .select("name, background_color, wallet_text_color, background_image_url, stamps_required, reward_text, logo_url")
    .eq("id", id)
    .single();

  const nextLogoUrl = logoUrl ?? before?.logo_url ?? null;
  const nextBackgroundImageUrl = backgroundImageUrl
    ? backgroundImageUrl
    : removeBackgroundImage
      ? null
      : (before?.background_image_url ?? null);

  const walletFieldsChanged =
    !before ||
    before.name !== name ||
    before.background_color !== backgroundColor ||
    before.wallet_text_color !== walletTextColor ||
    before.stamps_required !== stampsRequired ||
    before.reward_text !== rewardText ||
    before.logo_url !== nextLogoUrl ||
    before.background_image_url !== nextBackgroundImageUrl;

  const update: Record<string, unknown> = {
    name,
    slug,
    category: category || null,
    background_color: backgroundColor,
    wallet_text_color: walletTextColor,
    stamps_required: stampsRequired,
    reward_text: rewardText,
    welcome_offer_text: welcomeOfferText || null,
    address: address || null,
    interface_theme_color: interfaceThemeColor,
    interface_text_color: interfaceTextColor,
    interface_card_color: interfaceCardColor,
  };
  if (logoUrl) update.logo_url = logoUrl;
  if (backgroundImageUrl) {
    update.background_image_url = backgroundImageUrl;
  } else if (removeBackgroundImage) {
    update.background_image_url = null;
  }
  if (walletFieldsChanged) {
    // Lets the Apple Wallet push-update endpoint tell which already-saved
    // passes need refreshing (see apple-wallet-push.ts). Only bumped when a
    // field the pass actually renders changed, so it stays a reliable
    // "does this pass need refreshing" signal for passesUpdatedSince /
    // If-Modified-Since instead of moving on every save.
    update.updated_at = new Date().toISOString();
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
  // Wallet passes clients already saved for this restaurant. Google Wallet
  // is synced unconditionally as before (out of scope for the Apple-side
  // over-notification fix); the Apple push is gated on walletFieldsChanged.
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
    if (walletFieldsChanged) {
      after(() => notifyApplePassUpdatesForRestaurant(id));
    }
    // Reward text lives per-client on Google's side (see the function doc),
    // so it needs its own pass over every client instead of the one PATCH
    // updateGoogleWalletClassDesign sends for the shared class.
    after(() => updateGoogleWalletRewardTextForRestaurant(id));
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

// Extra per-restaurant options an admin can switch on. Kept as its own
// action (and its own form) so it can't interfere with the main edit form's
// image uploads and wallet sync -- and so more options can be added here
// later without touching updateRestaurant.
export async function updateRestaurantOptions(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const pushEnabled = formData.get("pushNotificationsEnabled") === "on";
  const rawPlan = String(formData.get("pushPlan") ?? "").trim();
  // Guard against an arbitrary value being posted: only known plan ids are
  // stored, anything else is treated as "no plan".
  const pushPlan = getPushPlan(rawPlan)?.id ?? null;

  if (pushEnabled && !pushPlan) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent(
        "Choisissez un forfait avant d'activer les notifications push."
      )}`
    );
  }

  const update: {
    push_notifications_enabled: boolean;
    push_plan: string | null;
    push_custom_limit?: number;
  } = { push_notifications_enabled: pushEnabled, push_plan: pushPlan };

  // Option 4's quota isn't fixed like the others -- validated here (integer,
  // > 0) rather than trusting the number input's client-side min/step, which
  // a crafted request to this action could post around entirely. The
  // column is only ever written when option4 is actually selected: switching
  // to another plan intentionally leaves the last custom value in place, so
  // it's still there pre-filled if the admin puts this restaurant back on
  // option4 later.
  if (pushPlan === "option4") {
    const rawLimit = String(formData.get("pushCustomLimit") ?? "").trim();
    const customLimit = Number(rawLimit);
    if (!Number.isInteger(customLimit) || customLimit <= 0) {
      return redirect(
        `/admin/restaurants/${id}?error=${encodeURIComponent(
          "Indiquez un nombre entier de notifications supérieur à 0 pour l'Option 4."
        )}`
      );
    }
    update.push_custom_limit = customLimit;
  }

  const { error } = await supabaseAdmin.from("restaurants").update(update).eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  // Deliberately does NOT bump updated_at or trigger the wallet sync: options
  // don't change the loyalty card, so there's no reason to re-push passes.
  redirect(`/admin/restaurants/${id}?optionsSaved=1`);
}

// RGPD field configuration: which of the 11 client-facing fields this
// restaurant collects at signup. Its own form/action (like
// updateRestaurantOptions above) so it can't interfere with the main edit
// form's image uploads and wallet sync. Unchecked boxes post nothing, so an
// absent key means "off" -- every flag must be written explicitly on every
// save, not merged with the previous value.
export async function updateRestaurantCollectFields(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({
      collect_first_name: formData.get("collectFirstName") === "on",
      collect_last_name: formData.get("collectLastName") === "on",
      collect_phone: formData.get("collectPhone") === "on",
      collect_email: formData.get("collectEmail") === "on",
      collect_city: formData.get("collectCity") === "on",
      collect_civilite: formData.get("collectCivilite") === "on",
      collect_date_naissance: formData.get("collectDateNaissance") === "on",
      collect_adresse_postale: formData.get("collectAdressePostale") === "on",
      collect_profession: formData.get("collectProfession") === "on",
      collect_nationalite: formData.get("collectNationalite") === "on",
      collect_code_parrainage: formData.get("collectCodeParrainage") === "on",
    })
    .eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  // Deliberately does NOT touch updated_at or the wallet sync: this only
  // affects the signup form, nothing the pass renders.
  redirect(`/admin/restaurants/${id}?collectFieldsSaved=1`);
}

// Per-restaurant switch for free-quantity stamp attribution (scan-with-
// quantity + add/retirer on the client fiche). Its own form/action, like
// updateRestaurantOptions above, so it can't interfere with the main edit
// form's image uploads and wallet sync. Deliberately does NOT touch
// updated_at or trigger a wallet push: flipping this never changes anything
// a pass renders, and never modifies any client's existing stamp count.
export async function updateRestaurantFreeStampManagement(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("freeStampManagement") === "on";

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({ free_stamp_management: enabled })
    .eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?freeStampManagementSaved=1`);
}

// Free-text internal note for the admin's own tracking. Never surfaced to
// the restaurant, the client, or either wallet. Empty string is stored as
// null so an emptied note reads the same as one that was never written.
export async function updateRestaurantNote(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("internalNote") ?? "").trim();

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({ internal_note: note || null })
    .eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?noteSaved=1`);
}

// Renaming the login identifier never touches the Supabase Auth user, its
// email or its password -- it only writes the separate `login_identifier`
// column that loginRestaurant() resolves at sign-in time.
export async function updateRestaurantIdentifier(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const loginIdentifier = String(formData.get("loginIdentifier") ?? "").trim();

  if (!loginIdentifier) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent("Identifiant requis.")}`
    );
  }

  const { data: clash } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("login_identifier_normalized", normalizeIdentifier(loginIdentifier))
    .neq("id", id)
    .maybeSingle();

  if (clash) {
    return redirect(
      `/admin/restaurants/${id}?error=${encodeURIComponent("Cet identifiant de connexion est déjà utilisé.")}`
    );
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({ login_identifier: loginIdentifier })
    .eq("id", id);

  if (error) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/restaurants/${id}?identifierUpdated=1`);
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
