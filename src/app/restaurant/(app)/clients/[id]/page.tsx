import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { FormField, formInputClass, primaryButtonClass } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { formatRelativeDate, formatTime } from "@/lib/format-relative-date";
import { computeVisitFrequency } from "@/lib/visit-frequency";
import { Panel } from "@/components/restaurant/Panel";
import { updateClient } from "../actions";
import { DeleteClientButton } from "../DeleteClientButton";
import { VipToggle } from "../VipToggle";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { id } = await params;
  const { error, saved } = await searchParams;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (!client) notFound();

  const fullName = `${client.first_name} ${client.last_name ?? ""}`.trim();

  const { data: visits } = await supabaseAdmin
    .from("visits")
    .select("created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const visitDates = (visits ?? []).map((v) => new Date(v.created_at));
  const frequency = computeVisitFrequency(visitDates);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl">
        <Link
          href="/restaurant"
          className="text-sm text-[var(--theme-text)]/60 underline hover:text-[var(--theme-text)]/80"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center gap-6">
          <LoyaltyCard
            restaurantName={restaurant.name}
            logoInitials={restaurant.name.slice(0, 2).toUpperCase()}
            logoUrl={restaurant.logo_url}
            stampsEarned={client.stamps}
            stampsRequired={restaurant.stamps_required}
            rewardText={restaurant.reward_text}
            memberName={fullName}
            backgroundColor={restaurant.background_color}
            backgroundImageUrl={restaurant.background_image_url}
          />

          <p className="text-center text-sm text-[var(--theme-text)]/60">
            Pour confirmer qu&apos;il s&apos;agit bien de ce client, vérifiez son email et sa ville :{" "}
            <span className="font-medium text-[var(--theme-text)]/90">
              {client.email}
              {client.city ? ` · ${client.city}` : ""}
            </span>
          </p>

          <Panel className="w-full">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold">{client.total_visits}</div>
                <div className="text-xs text-[var(--theme-card-fg,#18181b)]/60">Visites</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {client.stamps} / {restaurant.stamps_required}
                </div>
                <div className="text-xs text-[var(--theme-card-fg,#18181b)]/60">Tampons</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatRelativeDate(client.last_visit_at)}</div>
                <div className="text-xs text-[var(--theme-card-fg,#18181b)]/60">Dernière visite</div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <VipToggle clientId={client.id} initialIsVip={client.is_vip} />
            </div>
          </Panel>

          <Panel className="w-full">
            <h2 className="mb-3 text-sm font-semibold text-[var(--theme-card-fg,#18181b)]/60">
              Fréquence de visite
            </h2>
            <div className="mb-1 text-lg font-semibold">{frequency.label}</div>
            <p className="text-sm text-[var(--theme-card-fg,#18181b)]/60">{frequency.detail}</p>

            {visitDates.length > 0 && (
              <>
                <hr className="my-4 border-black/10 dark:border-white/10" />
                <h3 className="mb-2 text-sm font-semibold text-[var(--theme-card-fg,#18181b)]/60">
                  Historique des visites ({visitDates.length})
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {visitDates.slice(0, 12).map((date, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-black/5 px-2 py-1 text-xs text-[var(--theme-card-fg,#18181b)]/70 dark:bg-white/10"
                    >
                      {date.toLocaleDateString("fr-FR")} · {formatTime(date.toISOString())}
                    </li>
                  ))}
                  {visitDates.length > 12 && (
                    <li className="px-2 py-1 text-xs text-[var(--theme-card-fg,#18181b)]/50">
                      + {visitDates.length - 12} autre(s)
                    </li>
                  )}
                </ul>
              </>
            )}
          </Panel>
        </div>

        <div className="w-full">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Fiche client</h2>

          {saved && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Profil bien modifié.
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <form action={updateClient} className="space-y-4">
            <input type="hidden" name="id" value={client.id} />
            <FormField label="Prénom">
              <input name="firstName" defaultValue={client.first_name} required className={formInputClass} />
            </FormField>
            <FormField label="Nom">
              <input name="lastName" defaultValue={client.last_name ?? ""} required className={formInputClass} />
            </FormField>
            <FormField label="Email">
              <input
                name="email"
                type="email"
                defaultValue={client.email}
                required
                className={formInputClass}
              />
            </FormField>
            <FormField label="Téléphone (optionnel)">
              <input name="phone" type="tel" defaultValue={client.phone ?? ""} className={formInputClass} />
            </FormField>
            <FormField label="Ville">
              <input
                name="city"
                defaultValue={client.city ?? ""}
                required
                className={formInputClass}
              />
            </FormField>

            <SubmitButton pendingChildren="Enregistrement..." className={primaryButtonClass}>
              Enregistrer
            </SubmitButton>
          </form>

          <hr className="my-8 border-black/10 dark:border-white/10" />

          <h2 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</h2>
          <DeleteClientButton id={client.id} name={fullName} />
        </div>
      </div>
    </div>
  );
}
