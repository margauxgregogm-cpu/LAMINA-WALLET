import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formInputClass, primaryButtonClass } from "@/components/FormField";
import { Panel } from "@/components/restaurant/Panel";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { updateOwnPassword } from "./actions";

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordChanged?: string }>;
}) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { error, passwordChanged } = await searchParams;

  const { data: fullRestaurant } = await supabaseAdmin
    .from("restaurants")
    .select("category, address, welcome_offer_text")
    .eq("id", restaurant.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      </div>

      <Panel className="w-full max-w-2xl">
        <h2 className="mb-4 text-sm font-semibold">Informations du restaurant</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Nom</dt>
            <dd className="font-medium">{restaurant.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Catégorie</dt>
            <dd className="font-medium">{fullRestaurant?.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Tampons requis</dt>
            <dd className="font-medium">{restaurant.stamps_required}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Texte de la récompense</dt>
            <dd className="font-medium">{restaurant.reward_text}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Offre de bienvenue</dt>
            <dd className="font-medium">{fullRestaurant?.welcome_offer_text ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--theme-card-fg,#18181b)]/60">Adresse</dt>
            <dd className="font-medium">{fullRestaurant?.address ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-[var(--theme-card-fg,#18181b)]/60">
          Pour modifier ces informations, contactez l&apos;administrateur.
        </p>
      </Panel>

      <Panel className="w-full max-w-2xl">
        <h2 className="mb-4 text-sm font-semibold">Mon compte</h2>

        {passwordChanged && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Mot de passe modifié.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <PasswordChangeForm
          action={updateOwnPassword}
          variant="entreprise"
          inputClassName={formInputClass}
          buttonClassName={primaryButtonClass}
        />
      </Panel>
    </div>
  );
}
