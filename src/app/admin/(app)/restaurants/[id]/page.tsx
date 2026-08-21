import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { FormField } from "@/components/FormField";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { StampStyleFields } from "@/components/admin/StampStyleFields";
import { SubmitButton } from "@/components/SubmitButton";
import { adminInputClass, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/adminFormClasses";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import {
  updateRestaurant,
  resetRestaurantPassword,
  updateRestaurantOptions,
  updateRestaurantIdentifier,
  updateRestaurantCollectFields,
  updateRestaurantFreeStampManagement,
  updateRestaurantStampStyle,
  updateRestaurantNote,
} from "../actions";
import { DeleteRestaurantButton } from "../DeleteRestaurantButton";
import { AccessRestaurantButton } from "../AccessRestaurantButton";
import { getPushQuotaStatus } from "@/lib/push-quota";
import { describePeriod, formatRenewalDate } from "@/lib/push-plans";
import { PushPlanFields } from "@/components/admin/PushPlanFields";

export default async function EditRestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
    passwordReset?: string;
    optionsSaved?: string;
    identifierUpdated?: string;
    collectFieldsSaved?: string;
    freeStampManagementSaved?: string;
    stampStyleSaved?: string;
    noteSaved?: string;
  }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const {
    error,
    saved,
    passwordReset,
    optionsSaved,
    identifierUpdated,
    collectFieldsSaved,
    freeStampManagementSaved,
    stampStyleSaved,
    noteSaved,
  } = await searchParams;
  const pushStatus = await getPushQuotaStatus(id);

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (!restaurant) notFound();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/signup?r=${restaurant.slug}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 200, margin: 1 });

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
            <p className="text-sm text-zinc-400">{restaurant.login_identifier ?? " "}</p>
          </div>
          <AccessRestaurantButton id={restaurant.id} />
        </div>

        {saved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Profil bien modifié.
          </p>
        )}
        {passwordReset && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Mot de passe mis à jour.
          </p>
        )}
        {optionsSaved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Options mises à jour.
          </p>
        )}
        {identifierUpdated && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Identifiant de connexion mis à jour.
          </p>
        )}
        {collectFieldsSaved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Champs collectés mis à jour.
          </p>
        )}
        {freeStampManagementSaved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Gestion libre des tampons mise à jour.
          </p>
        )}
        {stampStyleSaved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Style des tampons mis à jour.
          </p>
        )}
        {noteSaved && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Note enregistrée.
          </p>
        )}
        {error && <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code du lien public" width={160} height={160} />
          <a href={publicUrl} className="break-all text-center text-sm text-blue-400 underline">
            {publicUrl}
          </a>
        </div>

        <form
          action={updateRestaurant}
          encType="multipart/form-data"
          className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
        >
          <input type="hidden" name="id" value={restaurant.id} />

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400">Champs obligatoires</h2>

              <FormField label="Nom de l'entreprise">
                <input name="name" defaultValue={restaurant.name} required className={adminInputClass} />
              </FormField>

              <FormField label="Lien public (slug)">
                <input
                  name="slug"
                  defaultValue={restaurant.slug}
                  required
                  pattern="[a-z0-9-]+"
                  className={adminInputClass}
                />
              </FormField>

              <FormField
                label="Nombre de passages pour la récompense"
                hint="0 = carte sans programme de tampons (aucun rond, aucun compteur affiché)"
              >
                <input
                  name="stampsRequired"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={restaurant.stamps_required}
                  required
                  className={adminInputClass}
                />
              </FormField>

              <FormField label="Texte de la récompense">
                <input
                  name="rewardText"
                  defaultValue={restaurant.reward_text}
                  required
                  className={adminInputClass}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400">Champs optionnels</h2>

              <FormField label="Catégorie">
                <select name="category" defaultValue={restaurant.category ?? ""} className={adminInputClass}>
                  <option value="">Choisir une catégorie...</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Couleur du fond de la carte"
                hint="utilisée si aucune image de fond n'est active"
              >
                <ColorSwatchPicker name="backgroundColor" defaultValue={restaurant.background_color} />
              </FormField>

              <FormField
                label="Couleur du texte de la carte"
                hint="s'applique à la récompense, au nom du client et à la progression des tampons (ex: 3/10) — Apple Wallet uniquement, Google Wallet choisit sa propre couleur de texte automatiquement"
              >
                <ColorSwatchPicker
                  name="walletTextColor"
                  defaultValue={restaurant.wallet_text_color ?? "#000000"}
                />
              </FormField>

              <hr className="border-white/10" />
              <p className="text-sm font-medium text-zinc-100">Couleurs de l&apos;interface entreprise</p>
              <p className="-mt-2 text-xs text-zinc-500">
                Indépendantes de la couleur de la carte de fidélité ci-dessus.
              </p>

              <FormField label="Couleur du thème de l'interface" hint="boutons, navigation active, accents">
                <ColorSwatchPicker
                  name="interfaceThemeColor"
                  defaultValue={restaurant.interface_theme_color ?? "#059669"}
                />
              </FormField>

              <FormField label="Couleur du texte de l'interface">
                <ColorSwatchPicker
                  name="interfaceTextColor"
                  defaultValue={restaurant.interface_text_color ?? "#18181b"}
                />
              </FormField>

              <FormField label="Couleur des cartes d'indicateurs">
                <ColorSwatchPicker
                  name="interfaceCardColor"
                  defaultValue={restaurant.interface_card_color ?? "#ffffff"}
                />
              </FormField>

              <FormField label="Offre de bienvenue (optionnel)">
                <input
                  name="welcomeOfferText"
                  defaultValue={restaurant.welcome_offer_text ?? ""}
                  className={adminInputClass}
                />
              </FormField>

              <FormField label="Adresse (optionnel)">
                <input name="address" defaultValue={restaurant.address ?? ""} className={adminInputClass} />
              </FormField>

              {restaurant.logo_url && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.logo_url}
                    alt="Logo actuel"
                    className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                  />
                  <span className="text-sm text-zinc-400">Logo actuel</span>
                </div>
              )}
              <FormField label="Remplacer le logo (optionnel)">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                />
              </FormField>

              {restaurant.background_image_url && (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.background_image_url}
                    alt="Image de fond actuelle"
                    className="h-12 w-20 rounded-lg border border-white/10 object-cover"
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <input type="checkbox" name="removeBackgroundImage" className="h-4 w-4" />
                    Supprimer l&apos;image de fond (revenir à la couleur)
                  </label>
                </div>
              )}
              <FormField
                label={
                  restaurant.background_image_url
                    ? "Remplacer l'image de fond (optionnel)"
                    : "Image de fond de la carte (optionnel)"
                }
                hint="si ajoutée, remplace la couleur choisie ci-dessus comme fond de la carte"
              >
                <input
                  name="backgroundImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                />
              </FormField>
            </div>
          </div>

          <SubmitButton pendingChildren="Enregistrement..." className={`${adminButtonClass} mt-6`}>
            Enregistrer
          </SubmitButton>
        </form>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-100">Options</h2>
          <p className="mb-5 text-sm text-zinc-400">
            Fonctionnalités supplémentaires activables pour cette entreprise.
          </p>

          <div className="rounded-xl border border-white/10 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-100">Notifications Push</h3>

            <form action={updateRestaurantOptions} className="space-y-4">
              <input type="hidden" name="id" value={restaurant.id} />

              <label className="flex items-center gap-3 text-sm text-zinc-100">
                <input
                  type="checkbox"
                  name="pushNotificationsEnabled"
                  defaultChecked={pushStatus.enabled}
                  className="h-4 w-4"
                />
                Activer les notifications push
              </label>

              <PushPlanFields
                defaultPlanId={pushStatus.plan?.id ?? ""}
                defaultCustomLimit={restaurant.push_custom_limit}
              />

              <SubmitButton pendingChildren="Enregistrement..." className={adminSecondaryButtonClass}>
                Enregistrer les options
              </SubmitButton>
            </form>

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">État</dt>
                <dd className={pushStatus.enabled ? "text-emerald-400" : "text-zinc-400"}>
                  {pushStatus.enabled ? "Activées" : "Désactivées"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Forfait</dt>
                <dd className="text-zinc-100">{pushStatus.plan?.label ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Limite</dt>
                <dd className="text-zinc-100">
                  {pushStatus.plan
                    ? `${pushStatus.limit} / ${pushStatus.plan.period === "quarter" ? "trimestre" : "mois"}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Utilisées</dt>
                <dd className="text-zinc-100">{pushStatus.plan ? pushStatus.used : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Restantes</dt>
                <dd className="text-zinc-100">{pushStatus.plan ? pushStatus.remaining : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Période</dt>
                <dd className="text-zinc-100">
                  {pushStatus.plan ? `${pushStatus.periodKey} (${describePeriod(pushStatus.plan)})` : "—"}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs text-zinc-500">Prochain renouvellement</dt>
                <dd className="text-zinc-100">
                  {pushStatus.renewalDate ? formatRenewalDate(pushStatus.renewalDate) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-100">
            Données collectées à la création d&apos;une carte
          </h2>
          <p className="mb-5 text-sm text-zinc-400">
            Choisissez les informations demandées au client sur le formulaire public de création de
            carte pour cette entreprise. Les clients déjà créés conservent toutes leurs données
            existantes, quelle que soit la configuration choisie ici.
          </p>

          <form action={updateRestaurantCollectFields} className="space-y-3">
            <input type="hidden" name="id" value={restaurant.id} />

            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectFirstName"
                defaultChecked={restaurant.collect_first_name ?? true}
                className="h-4 w-4"
              />
              Prénom
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectLastName"
                defaultChecked={restaurant.collect_last_name ?? true}
                className="h-4 w-4"
              />
              Nom
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectPhone"
                defaultChecked={restaurant.collect_phone ?? true}
                className="h-4 w-4"
              />
              Numéro de téléphone
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectEmail"
                defaultChecked={restaurant.collect_email ?? true}
                className="h-4 w-4"
              />
              Email
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectCity"
                defaultChecked={restaurant.collect_city ?? true}
                className="h-4 w-4"
              />
              Ville
            </label>

            <hr className="border-white/10" />

            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectCivilite"
                defaultChecked={restaurant.collect_civilite ?? false}
                className="h-4 w-4"
              />
              Civilité
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectDateNaissance"
                defaultChecked={restaurant.collect_date_naissance ?? false}
                className="h-4 w-4"
              />
              Date de naissance
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectAdressePostale"
                defaultChecked={restaurant.collect_adresse_postale ?? false}
                className="h-4 w-4"
              />
              Adresse postale
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectProfession"
                defaultChecked={restaurant.collect_profession ?? false}
                className="h-4 w-4"
              />
              Profession
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectNationalite"
                defaultChecked={restaurant.collect_nationalite ?? false}
                className="h-4 w-4"
              />
              Nationalité
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="collectCodeParrainage"
                defaultChecked={restaurant.collect_code_parrainage ?? false}
                className="h-4 w-4"
              />
              Code de parrainage
            </label>

            <SubmitButton pendingChildren="Enregistrement..." className={`${adminSecondaryButtonClass} mt-2`}>
              Enregistrer les champs collectés
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-100">
            Gestion libre des tampons
          </h2>
          <p className="mb-5 text-sm text-zinc-400">
            Autoriser cette entreprise à choisir librement le nombre de tampons à ajouter ou
            retirer (scan et fiche client). Désactivée, l&apos;entreprise garde le fonctionnement
            actuel : 1 scan ou 1 ajout = 1 tampon. Activer ou désactiver cette option ne modifie
            jamais les tampons déjà attribués.
          </p>
          <form action={updateRestaurantFreeStampManagement} className="space-y-4">
            <input type="hidden" name="id" value={restaurant.id} />
            <label className="flex items-center gap-3 text-sm text-zinc-100">
              <input
                type="checkbox"
                name="freeStampManagement"
                defaultChecked={restaurant.free_stamp_management ?? false}
                className="h-4 w-4"
              />
              Autoriser cette entreprise à gérer librement le nombre de tampons
            </label>
            <SubmitButton pendingChildren="Enregistrement..." className={adminSecondaryButtonClass}>
              Enregistrer
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-1 text-lg font-bold tracking-tight text-zinc-100">Style des tampons</h2>
          <p className="mb-5 text-sm text-zinc-400">
            Choisissez comment les tampons obtenus sont affichés sur la carte (Apple Wallet et aperçu
            web). Le compteur de progression (ex. 3/10) reste toujours affiché, sauf si le nombre de
            passages pour la récompense est fixé à 0. Changer de style ne modifie jamais les tampons
            déjà attribués aux clients.
          </p>
          <form
            action={updateRestaurantStampStyle}
            encType="multipart/form-data"
            className="space-y-4"
          >
            <input type="hidden" name="id" value={restaurant.id} />
            <input type="hidden" name="slug" value={restaurant.slug} />

            <StampStyleFields
              defaultStyle={(restaurant.stamp_display_style as "color" | "image" | "counter") ?? "color"}
              defaultColor={restaurant.stamp_color ?? "#10b981"}
              currentImageUrl={restaurant.stamp_image_url}
            />

            <SubmitButton pendingChildren="Enregistrement..." className={adminSecondaryButtonClass}>
              Enregistrer le style des tampons
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-3 text-lg font-bold tracking-tight text-zinc-100">Note interne</h2>
          <form action={updateRestaurantNote} className="space-y-3">
            <input type="hidden" name="id" value={restaurant.id} />
            <textarea
              name="internalNote"
              rows={6}
              defaultValue={restaurant.internal_note ?? ""}
              placeholder="Notes, suivi commercial, contexte particulier sur cette entreprise..."
              className={`${adminInputClass} resize-y`}
            />
            <SubmitButton pendingChildren="Enregistrement..." className={adminSecondaryButtonClass}>
              Enregistrer la note
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">Identifiant de connexion</h2>
          <form action={updateRestaurantIdentifier} className="flex gap-2">
            <input type="hidden" name="id" value={restaurant.id} />
            <input
              name="loginIdentifier"
              defaultValue={restaurant.login_identifier ?? ""}
              required
              className={adminInputClass}
            />
            <SubmitButton pendingChildren="..." className={adminSecondaryButtonClass}>
              Enregistrer
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-zinc-100">Mot de passe du restaurant</h2>
          <form action={resetRestaurantPassword} className="flex gap-2">
            <input type="hidden" name="id" value={restaurant.id} />
            <input
              name="newPassword"
              type="text"
              placeholder="Nouveau mot de passe (6 caractères min.)"
              required
              minLength={6}
              className={adminInputClass}
            />
            <SubmitButton pendingChildren="..." className={adminSecondaryButtonClass}>
              Réinitialiser
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-red-900/50 bg-zinc-900 p-6">
          <h2 className="mb-3 text-sm font-semibold text-red-400">Zone de danger</h2>
          <DeleteRestaurantButton id={restaurant.id} name={restaurant.name} />
        </div>
      </div>
    </div>
  );
}
