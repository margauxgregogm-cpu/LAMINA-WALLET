import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { Panel } from "@/components/restaurant/Panel";
import { formInputClass, primaryButtonClass } from "@/components/FormField";

// Pure UI shell -- no backend, no server actions, no external notification
// service. Everything below is disabled/labeled "Bientôt disponible" per
// explicit instruction: the sending system will be wired up later.
export default async function NotificationsPage() {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Notifications Push</h1>
        <p className="text-[var(--theme-text)]/60">
          Envoyez bientôt des notifications à vos clients directement dans leur carte de fidélité.
        </p>
      </div>

      <Panel className="w-full max-w-2xl">
        <span className="mb-4 inline-block rounded-full bg-[var(--theme-accent,#059669)]/10 px-3 py-1 text-xs font-medium text-[var(--theme-accent,#059669)]">
          Bientôt disponible
        </span>
        <h2 className="mb-4 text-sm font-semibold">Créer une notification</h2>
        <div className="pointer-events-none space-y-4 opacity-50">
          <div>
            <label className="mb-1 block text-sm font-medium">Titre de la notification</label>
            <input disabled placeholder="Ex : Offre spéciale ce week-end" className={formInputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              disabled
              rows={3}
              placeholder="Contenu de la notification..."
              className={formInputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Destinataires</label>
            <select disabled className={formInputClass}>
              <option>Tous les clients</option>
            </select>
          </div>
          <button disabled className={primaryButtonClass}>
            Envoyer
          </button>
        </div>
      </Panel>

      <Panel className="w-full max-w-2xl">
        <h2 className="mb-2 text-sm font-semibold">Historique des notifications</h2>
        <p className="text-sm text-[var(--theme-card-fg,#18181b)]/60">
          L&apos;historique de vos notifications envoyées apparaîtra ici une fois la fonctionnalité activée.
        </p>
      </Panel>
    </div>
  );
}
