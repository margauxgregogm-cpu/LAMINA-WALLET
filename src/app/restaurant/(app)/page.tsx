import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getClientsCount, getVisitsCountInRange, startOfMonth } from "@/lib/restaurant-stats";
import { formatRelativeDate, formatTime } from "@/lib/format-relative-date";
import { Panel } from "@/components/restaurant/Panel";
import { KpiTile } from "@/components/restaurant/KpiTile";
import { LiveDashboardUpdates } from "./LiveDashboardUpdates";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent-soft)] text-xs font-bold text-[var(--theme-accent-strong)]">
      {initials}
    </span>
  );
}

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
  // with the KPI queries alongside the existing ones.
  const [
    { data: topClients },
    { data: recentClients },
    qrDataUrl,
    clientsCount,
    visitsThisMonth,
    visitsLastMonth,
  ] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("id, first_name, last_name, total_visits, last_visit_at")
      .eq("restaurant_id", restaurant.id)
      .order("total_visits", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("clients")
      .select("id, first_name, last_name, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    QRCode.toDataURL(publicUrl, { width: 220, margin: 1 }),
    getClientsCount(restaurant.id),
    getVisitsCountInRange(restaurant.id, thisMonthStart),
    getVisitsCountInRange(restaurant.id, lastMonthStart, thisMonthStart),
  ]);

  const visitsDelta = visitsThisMonth - visitsLastMonth;
  const visitsDeltaLabel =
    visitsLastMonth === 0
      ? undefined
      : `${visitsDelta >= 0 ? "+" : ""}${visitsDelta} vs mois dernier`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <LiveDashboardUpdates restaurantId={restaurant.id} />

      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Bonjour, {restaurant.name} 👋
        </h1>
        <p className="text-sm opacity-60">Voici votre activité aujourd&apos;hui.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <KpiTile
          icon="clients"
          label="Clients"
          value={clientsCount}
          sublabel="Total"
          href="/restaurant/clients"
        />
        <KpiTile
          icon="stats"
          label="Visites ce mois-ci"
          value={visitsThisMonth}
          sublabel={visitsDeltaLabel}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Inscrire un nouveau client" className="lg:col-span-1">
          <p className="mb-3 text-sm opacity-60">
            Montrez ce QR code à un client pour qu&apos;il crée sa carte de fidélité.
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border border-[var(--theme-accent-soft)] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code d'inscription"
                className="h-auto w-full max-w-[150px]"
              />
            </div>
            <a
              href={publicUrl}
              className="break-all text-center text-[11px] font-medium text-[var(--theme-accent-strong)] underline"
            >
              {publicUrl}
            </a>
          </div>
        </Panel>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel
            title="Meilleurs clients"
            actionLabel="Voir tout"
            actionHref="/restaurant/clients"
            bodyClassName="pt-3"
          >
            {topClients && topClients.length > 0 ? (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide opacity-50">
                    <tr>
                      <th className="px-2 py-2 font-semibold">#</th>
                      <th className="px-2 py-2 font-semibold">Client</th>
                      <th className="px-2 py-2 font-semibold">Visites</th>
                      <th className="px-2 py-2 font-semibold">Dernière visite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client, i) => {
                      const fullName = `${client.first_name} ${client.last_name ?? ""}`.trim();
                      return (
                        <tr key={client.id} className="border-t border-black/5">
                          <td className="px-2 py-3 opacity-50">{i + 1}</td>
                          <td className="px-2 py-3">
                            <Link
                              href={`/restaurant/clients/${client.id}`}
                              className="flex items-center gap-2 font-medium underline-offset-2 hover:underline"
                            >
                              <Initials name={fullName} />
                              <span className="truncate">{fullName}</span>
                            </Link>
                          </td>
                          <td className="px-2 py-3">{client.total_visits}</td>
                          <td className="px-2 py-3">{formatRelativeDate(client.last_visit_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-sm opacity-50">Aucun client pour le moment.</p>
            )}
          </Panel>

          <Panel
            title="Derniers inscrits"
            actionLabel="Voir tout"
            actionHref="/restaurant/clients"
            bodyClassName="pt-3"
          >
            {recentClients && recentClients.length > 0 ? (
              <div className="flex flex-col">
                {recentClients.map((client) => {
                  const fullName = `${client.first_name} ${client.last_name ?? ""}`.trim();
                  return (
                    <Link
                      key={client.id}
                      href={`/restaurant/clients/${client.id}`}
                      className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0 hover:opacity-80"
                    >
                      <Initials name={fullName} />
                      <span className="min-w-0 flex-1 truncate font-medium">{fullName}</span>
                      <span className="shrink-0 text-right text-sm opacity-60">
                        <span className="block">{formatRelativeDate(client.created_at)}</span>
                        <span className="block text-xs">{formatTime(client.created_at)}</span>
                      </span>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-30">
                        <path d="M7.5 4.5 13 10l-5.5 5.5L6 14l4-4-4-4 1.5-1.5Z" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-sm opacity-50">Aucune inscription pour le moment.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[var(--theme-accent-soft)] px-4 py-3 text-sm">
        <span className="text-lg leading-none">💡</span>
        <p>
          <span className="font-semibold">Conseil</span> — Scannez la carte de fidélité d&apos;un
          client depuis la page <span className="font-semibold">Scanner</span> pour accéder à son{" "}
          <span className="font-semibold">profil</span> et à son{" "}
          <span className="font-semibold">historique</span>.
        </p>
      </div>
    </div>
  );
}
