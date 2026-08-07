import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logoutRestaurant } from "../login/actions";
import { ScanClient } from "./ScanClient";

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/restaurant/login");

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name")
    .eq("user_id", user.id)
    .single();

  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="flex w-full max-w-sm items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{restaurant.name}</h1>
          <p className="text-sm text-zinc-500">Scanner une carte de fidélité</p>
        </div>
        <form action={logoutRestaurant}>
          <button className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Déconnexion
          </button>
        </form>
      </div>

      <ScanClient />
    </div>
  );
}
