import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import {
  getVisitsCountInRange,
  getActiveClientsCountSince,
  getWeeklyVisitCounts,
  startOfMonth,
} from "@/lib/restaurant-stats";
import { KpiTile } from "@/components/restaurant/KpiTile";
import { Panel } from "@/components/restaurant/Panel";

export default async function VisitesPage() {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const [visitsThisMonth, visitsLastMonth, activeClientsThisMonth, weeklyCounts] = await Promise.all([
    getVisitsCountInRange(restaurant.id, thisMonthStart),
    getVisitsCountInRange(restaurant.id, lastMonthStart, thisMonthStart),
    getActiveClientsCountSince(restaurant.id, thisMonthStart),
    getWeeklyVisitCounts(restaurant.id, 8),
  ]);

  const visitsDelta = visitsThisMonth - visitsLastMonth;
  const visitsDeltaLabel =
    visitsLastMonth === 0 ? undefined : `${visitsDelta >= 0 ? "+" : ""}${visitsDelta} vs mois dernier`;
  const maxWeekly = Math.max(1, ...weeklyCounts.map((w) => w.count));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Visites &amp; statistiques</h1>
        <p className="opacity-60">Activité réelle de votre carte de fidélité.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiTile
          icon="stats"
          label="Visites ce mois-ci"
          value={visitsThisMonth}
          sublabel={visitsDeltaLabel}
        />
        <KpiTile
          icon="clients"
          label="Clients actifs ce mois-ci"
          value={activeClientsThisMonth}
          sublabel="Clients ayant visité au moins une fois"
        />
      </div>

      <Panel title="Visites par semaine (8 dernières semaines)">
        <div className="flex flex-col gap-2">
          {weeklyCounts.map(({ weekStart, count }) => (
            <div key={weekStart.toISOString()} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-[var(--theme-card-fg,#18181b)]/60">
                {weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--theme-accent,#059669)]"
                  style={{ width: `${(count / maxWeekly) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-medium">{count}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
