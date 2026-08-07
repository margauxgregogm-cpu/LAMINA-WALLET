import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RestaurantNav } from "@/components/RestaurantNav";
import { formatRelativeDate } from "@/lib/format-relative-date";
import { SearchClients } from "./SearchClients";

export default async function RestaurantDashboardPage() {
  const restaurant = await getAuthenticatedRestaurant();

  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { data: topClients } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, total_visits, last_visit_at, is_vip")
    .eq("restaurant_id", restaurant.id)
    .order("total_visits", { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <RestaurantNav restaurantName={restaurant.name} active="dashboard" />

      <SearchClients />

      <div className="w-full max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">Meilleurs clients</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Visites</th>
                <th className="px-4 py-2">Dernière visite</th>
                <th className="px-4 py-2">VIP</th>
              </tr>
            </thead>
            <tbody>
              {(topClients ?? []).map((client, i) => (
                <tr key={client.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2 text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{client.first_name}</td>
                  <td className="px-4 py-2">{client.total_visits}</td>
                  <td className="px-4 py-2">{formatRelativeDate(client.last_visit_at)}</td>
                  <td className="px-4 py-2">{client.is_vip ? "⭐" : ""}</td>
                </tr>
              ))}
              {(!topClients || topClients.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    Aucun client pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
