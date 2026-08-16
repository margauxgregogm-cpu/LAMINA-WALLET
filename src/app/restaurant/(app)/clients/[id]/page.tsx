import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { FormField, formInputClass, primaryButtonClass } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { formatRelativeDate, formatTime } from "@/lib/format-relative-date";
import { computeVisitFrequency } from "@/lib/visit-frequency";
import { Panel } from "@/components/restaurant/Panel";
import { updateClient, updateClientNote } from "../actions";
import { DeleteClientButton } from "../DeleteClientButton";
import { CommercialConsentToggle } from "../CommercialConsentToggle";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; noteSaved?: string }>;
}) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { id } = await params;
  const { error, saved, noteSaved } = await searchParams;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (!client) notFound();

  // first_name can be absent when this restaurant's RGPD config doesn't
  // collect it -- never let the wallet/card member-name slot render the
  // literal word "null".
  const fullName =
    [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || "Client";

  const { data: visits } = await supabaseAdmin
    .from("visits")
    .select("created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const visitDates = (visits ?? []).map((v) => new Date(v.created_at));
  const frequency = computeVisitFrequency(visitDates);

  const qrDataUrl = await QRCode.toDataURL(client.id, { width: 220, margin: 1 });

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
            textColor={restaurant.wallet_text_color}
          />

          {(client.email || client.city) && (
            <p className="text-center text-sm text-[var(--theme-text)]/60">
              Pour confirmer qu&apos;il s&apos;agit bien de ce client, vérifiez son email et sa ville :{" "}
              <span className="font-medium text-[var(--theme-text)]/90">
                {[client.email, client.city].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}

          <Panel title="QR code de la carte" className="w-full">
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code de la carte de fidélité"
                width={180}
                height={180}
                className="rounded-lg border border-black/10 dark:border-white/10"
              />
              <a
                href={`/api/restaurant/clients/${client.id}/qr`}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M10 3a1 1 0 0 1 1 1v7.086l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 11.086V4a1 1 0 0 1 1-1Z" />
                  <path d="M4 14a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1Z" />
                </svg>
                Télécharger en PNG
              </a>
            </div>
          </Panel>

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
              <input
                name="firstName"
                defaultValue={client.first_name ?? ""}
                required={restaurant.collect_first_name}
                className={formInputClass}
              />
            </FormField>
            <FormField label="Nom">
              <input
                name="lastName"
                defaultValue={client.last_name ?? ""}
                required={restaurant.collect_last_name}
                className={formInputClass}
              />
            </FormField>
            <FormField label="Email">
              <input
                name="email"
                type="email"
                defaultValue={client.email ?? ""}
                required={restaurant.collect_email}
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
                required={restaurant.collect_city}
                className={formInputClass}
              />
            </FormField>
            <FormField label="Civilité (optionnel)">
              <select name="civilite" defaultValue={client.civilite ?? ""} className={formInputClass}>
                <option value="">Sélectionner...</option>
                <option value="Madame">Madame</option>
                <option value="Monsieur">Monsieur</option>
                <option value="Autre">Autre</option>
              </select>
            </FormField>
            <FormField label="Date de naissance (optionnel)">
              <input
                name="dateNaissance"
                type="date"
                defaultValue={client.date_naissance ?? ""}
                className={formInputClass}
              />
            </FormField>
            <FormField label="Adresse postale (optionnel)">
              <textarea
                name="adressePostale"
                rows={2}
                defaultValue={client.adresse_postale ?? ""}
                className={`${formInputClass} resize-y`}
              />
            </FormField>
            <FormField label="Profession (optionnel)">
              <input name="profession" defaultValue={client.profession ?? ""} className={formInputClass} />
            </FormField>
            <FormField label="Nationalité (optionnel)">
              <input name="nationalite" defaultValue={client.nationalite ?? ""} className={formInputClass} />
            </FormField>
            <FormField label="Code de parrainage (optionnel)">
              <input
                name="codeParrainage"
                defaultValue={client.code_parrainage ?? ""}
                className={formInputClass}
              />
            </FormField>

            <SubmitButton pendingChildren="Enregistrement..." className={primaryButtonClass}>
              Enregistrer
            </SubmitButton>
          </form>

          <hr className="my-8 border-black/10 dark:border-white/10" />

          <Panel title="Marketing">
            <CommercialConsentToggle id={client.id} consent={client.commercial_email_consent} />
          </Panel>

          <hr className="my-8 border-black/10 dark:border-white/10" />

          <Panel title="Note interne">
            {noteSaved && (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Note enregistrée.
              </p>
            )}
            <form action={updateClientNote} className="space-y-3">
              <input type="hidden" name="id" value={client.id} />
              <textarea
                name="internalNote"
                rows={5}
                defaultValue={client.internal_note ?? ""}
                placeholder="Préférences, remarques internes, contexte particulier sur ce client..."
                className={`${formInputClass} resize-y`}
              />
              <SubmitButton pendingChildren="Enregistrement..." className={primaryButtonClass}>
                Enregistrer la note
              </SubmitButton>
            </form>
          </Panel>

          <hr className="my-8 border-black/10 dark:border-white/10" />

          <h2 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</h2>
          <DeleteClientButton id={client.id} name={fullName} />
        </div>
      </div>
    </div>
  );
}
