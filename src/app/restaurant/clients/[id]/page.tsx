import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { FormField, formInputClass } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { formatRelativeDate } from "@/lib/format-relative-date";
import { computeVisitFrequency } from "@/lib/visit-frequency";
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
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-lg">
        <Link
          href="/restaurant"
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

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

      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-semibold">{client.total_visits}</div>
            <div className="text-xs text-zinc-500">Visites</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">
              {client.stamps} / {restaurant.stamps_required}
            </div>
            <div className="text-xs text-zinc-500">Tampons</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{formatRelativeDate(client.last_visit_at)}</div>
            <div className="text-xs text-zinc-500">Dernière visite</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <VipToggle clientId={client.id} initialIsVip={client.is_vip} />
        </div>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">Fréquence de visite</h2>
        <div className="mb-1 text-lg font-semibold">{frequency.label}</div>
        <p className="text-sm text-zinc-500">{frequency.detail}</p>

        {visitDates.length > 0 && (
          <>
            <hr className="my-4 border-zinc-200 dark:border-zinc-800" />
            <h3 className="mb-2 text-sm font-semibold text-zinc-500">
              Historique des visites ({visitDates.length})
            </h3>
            <ul className="flex flex-wrap gap-2">
              {visitDates.slice(0, 12).map((date, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {date.toLocaleDateString("fr-FR")}
                </li>
              ))}
              {visitDates.length > 12 && (
                <li className="px-2 py-1 text-xs text-zinc-400">
                  + {visitDates.length - 12} autre(s)
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="w-full max-w-lg">
        <h2 className="mb-4 text-lg font-semibold">Fiche client</h2>

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

          <SubmitButton
            pendingChildren="Enregistrement..."
            className="w-full rounded-full bg-zinc-900 px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Enregistrer
          </SubmitButton>
        </form>

        <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

        <h2 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</h2>
        <DeleteClientButton id={client.id} name={fullName} />
      </div>
    </div>
  );
}
