import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { RestaurantNav } from "@/components/RestaurantNav";
import { formatRelativeDate } from "@/lib/format-relative-date";
import { SearchClients } from "./SearchClients";
import { LiveDashboardUpdates } from "./LiveDashboardUpdates";

export default async function RestaurantDashboardPage() {
  const restaurant = await getAuthenticatedRestaurant();

  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/signup?r=${restaurant.slug}`;

  // These three don't depend on each other — running them in parallel
  // instead of sequential awaits noticeably speeds up loading this page,
  // which was the main source of the dashboard feeling slow to open.
  const [{ data: topClients }, { data: recentClients }, qrDataUrl] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("id, first_name, last_name, total_visits, last_visit_at, is_vip")
      .eq("restaurant_id", restaurant.id)
      .order("total_visits", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("clients")
      .select("id, first_name, last_name, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    QRCode.toDataURL(publicUrl, { width: 200, margin: 1 }),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <LiveDashboardUpdates restaurantId={restaurant.id} />
      <RestaurantNav restaurantName={restaurant.name} logoUrl={restaurant.logo_url} active="dashboard" />

      <div className="flex w-full max-w-2xl flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-semibold">Inscrire un nouveau client</h2>
        <p className="mb-2 text-center text-sm text-zinc-500">
          Montrez ce QR code à un client pour qu&apos;il crée sa carte de fidélité.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR code d'inscription" width={200} height={200} />
        <a
          href={publicUrl}
          className="break-all text-center text-sm text-blue-600 underline dark:text-blue-400"
        >
          {publicUrl}
        </a>
      </div>

      <SearchClients />

      {recentClients && recentClients.length > 0 && (
        <div className="w-full max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold">Derniers inscrits</h2>
          <div className="flex flex-col gap-2">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/restaurant/clients/${client.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="font-medium">
                  {client.first_name} {client.last_name}
                </span>
                <span className="text-zinc-500">{formatRelativeDate(client.created_at)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/restaurant/clients/${client.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {client.first_name} {client.last_name}
                    </Link>
                  </td>
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
