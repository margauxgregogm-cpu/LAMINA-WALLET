"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const GENERIC_ERROR = "Impossible d'ouvrir l'interface entreprise.";

// Lets an Admin open a restaurant's own interface without ever knowing or
// touching its password: mints a real Supabase Auth session for that
// restaurant's existing user_id via the Admin API's magic-link exchange
// (generateLink only returns a token -- it never sends an email) and hands
// that token straight to verifyOtp server-side. From there the session is a
// completely normal sb-restaurant-auth session -- same cookie, same
// getAuthenticatedRestaurant() path, same RLS posture as a password login --
// so nothing downstream (Wallet, realtime, RGPD exports...) can tell the
// difference. The admin's own sb-admin-auth cookie is never read or written
// here, so this cannot affect the admin session.
export async function impersonateRestaurant(id: string) {
  await requireAdmin();

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!restaurant?.user_id) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(GENERIC_ERROR)}`);
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(restaurant.user_id);
  const email = authUser?.user?.email;

  if (!email) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(GENERIC_ERROR)}`);
  }

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !link) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(GENERIC_ERROR)}`);
  }

  // "restaurant" section -> writes the sb-restaurant-auth cookie only,
  // exactly like loginRestaurant() in restaurant/login/actions.ts.
  const supabase = await createClient("restaurant");
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });

  if (verifyError) {
    return redirect(`/admin/restaurants/${id}?error=${encodeURIComponent(GENERIC_ERROR)}`);
  }

  redirect("/restaurant");
}
