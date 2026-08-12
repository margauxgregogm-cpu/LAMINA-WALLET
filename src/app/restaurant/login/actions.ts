"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Generic on purpose -- an identifier-specific error ("no such identifier"
// vs "wrong password") would let someone enumerate which identifiers exist.
const INVALID_CREDENTIALS_ERROR = "Identifiant ou mot de passe incorrect.";

export async function loginRestaurant(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const normalizedIdentifier = identifier.toLowerCase();

  // The identifier is a plain restaurants column, resolved with the
  // service_role client (never exposed to the browser) into the Supabase
  // Auth user's actual (now purely internal/technical) email -- the
  // restaurant never sees or types that email, and signInWithPassword below
  // still runs against the exact same Auth user, password and session as
  // before the identifier existed.
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("user_id")
    .eq("login_identifier_normalized", normalizedIdentifier)
    .maybeSingle();

  if (!restaurant?.user_id) {
    redirect(`/restaurant/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(restaurant.user_id);
  const email = authUser?.user?.email;

  if (!email) {
    redirect(`/restaurant/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  const supabase = await createClient("restaurant");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/restaurant/login?error=${encodeURIComponent(INVALID_CREDENTIALS_ERROR)}`);
  }

  redirect("/restaurant/scan");
}

export async function logoutRestaurant() {
  const supabase = await createClient("restaurant");
  // scope: "local" ends only this device's session. Supabase defaults to
  // "global", which revokes every session of the account everywhere -- so
  // one till logging out kicked every other till and phone off the same
  // restaurant account.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/restaurant/login");
}
