import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getClientsCount, getVipCount, getVisitsCountInRange, startOfMonth } from "@/lib/restaurant-stats";
import { formatRelativeDate, formatTime } from "@/lib/format-relative-date";
import { Panel } from "@/components/restaurant/Panel";
import { KpiTile } from "@/components/restaurant/KpiTile";
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

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  // All independent — running in parallel keeps the dashboard fast even
  // with the new KPI queries added alongside the existing ones.
  const [
    { data: topClients },
    { data: recentClients },
    qrDataUrl,
    clientsCount,
    vipCount,
    visitsThisMonth,
    visitsLastMonth,
  ] = await Promise.all([
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
    getClientsCount(restaurant.id),
    getVipCount(restaurant.id),
    getVisitsCountInRange(restaurant.id, thisMonthStart),
    getVisitsCountInRange(restaurant.id, lastMonthStart, thisMonthStart),
  ]);

  const visitsDelta = visitsThisMonth - visitsLastMonth;
  const visitsDeltaLabel =
    visitsLastMonth === 0
      ? undefined
      : `${visitsDelta >= 0 ? "+" : ""}${visitsDelta} vs mois dernier`;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8 md:py-12">
      <LiveDashboardUpdates restaurantId={restaurant.id} />

      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold tracking-tight">Bonjour, {restaurant.name} 👋</h1>
        <p className="text-[var(--theme-text)]/60">Voici votre activité aujourd&apos;hui.</p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile label="Clients" value={clientsCount} sublabel="Total" />
        <KpiTile label="Visites ce mois-ci" value={visitsThisMonth} sublabel={visitsDeltaLabel} />
        <KpiTile label="VIP" value={vipCount} sublabel="Clients VIP" />
      </div>

      <div className="w-full max-w-5xl">
        <SearchClients />
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Panel className="flex flex-col items-center gap-2">
            <h2 className="mb-1 text-sm font-semibold">Inscrire un nouveau client</h2>
            <p className="mb-2 text-center text-sm text-[var(--theme-card-fg,#18181b)]/70">
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
          </Panel>

          <div>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Meilleurs clients</h2>
            <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
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
                    <tr key={client.id} className="border-t border-black/10 dark:border-white/10">
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

        <div>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Derniers inscrits</h2>
          {recentClients && recentClients.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentClients.map((client) => (
                <Link key={client.id} href={`/restaurant/clients/${client.id}`}>
                  <Panel className="flex items-center justify-between text-sm hover:border-black/20 dark:hover:border-white/20">
                    <span className="font-medium">
                      {client.first_name} {client.last_name}
                    </span>
                    <span className="text-right text-[var(--theme-card-fg,#18181b)]/70">
                      <span className="block">{formatRelativeDate(client.created_at)}</span>
                      <span className="block text-xs">{formatTime(client.created_at)}</span>
                    </span>
                  </Panel>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--theme-text)]/60">Aucune inscription pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
