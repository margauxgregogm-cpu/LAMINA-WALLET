import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ClientCard } from "@/components/restaurant/ClientCard";

export default async function VipPage() {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, email, city, stamps, total_visits, is_vip, last_visit_at")
    .eq("restaurant_id", restaurant.id)
    .eq("is_vip", true)
    .order("total_visits", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clients VIP ⭐</h1>
        <p className="opacity-60">{(clients ?? []).length} client(s) VIP.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(clients ?? []).map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
        {(!clients || clients.length === 0) && (
          <p className="text-sm opacity-60">
            Aucun client VIP pour le moment. Marquez un client comme VIP depuis sa fiche.
          </p>
        )}
      </div>
    </div>
  );
}
