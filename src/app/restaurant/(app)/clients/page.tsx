import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ClientCard } from "@/components/restaurant/ClientCard";
import { SearchClients } from "../SearchClients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { q } = await searchParams;

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, last_name, email, city, stamps, total_visits, last_visit_at")
    .eq("restaurant_id", restaurant.id)
    .order("first_name")
    .limit(50);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clients</h1>
        <p className="opacity-60">Recherchez un client ou parcourez la liste complète.</p>
      </div>

      <SearchClients initialQuery={q ?? ""} />

      <div>
        <h2 className="mb-3 font-bold tracking-tight">Tous les clients</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(clients ?? []).map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
          {(!clients || clients.length === 0) && (
            <p className="text-sm opacity-60">Aucun client pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
