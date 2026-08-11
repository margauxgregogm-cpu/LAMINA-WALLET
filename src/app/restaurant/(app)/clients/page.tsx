import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ClientCard } from "@/components/restaurant/ClientCard";
import { SearchClients } from "../SearchClients";

export default async function ClientsPage() {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, email, city, stamps, total_visits, is_vip, last_visit_at")
    .eq("restaurant_id", restaurant.id)
    .order("first_name")
    .limit(50);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-[var(--theme-text)]/60">Recherchez un client ou parcourez la liste complète.</p>
      </div>

      <div className="w-full max-w-5xl">
        <SearchClients />
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
        {(clients ?? []).map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
        {(!clients || clients.length === 0) && (
          <p className="text-sm text-[var(--theme-text)]/60">Aucun client pour le moment.</p>
        )}
      </div>
    </div>
  );
}
