import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { FormField } from "@/components/FormField";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { adminInputClass, adminButtonClass } from "@/components/admin/adminFormClasses";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { createRestaurant } from "../actions";

export default async function NewRestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Nouvelle entreprise</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <form
          action={createRestaurant}
          encType="multipart/form-data"
          className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400">Champs obligatoires</h2>

              <FormField label="Nom de l'entreprise">
                <input name="name" required className={adminInputClass} />
              </FormField>

              <FormField
                label="Lien public (slug)"
                hint="lettres minuscules, chiffres et tirets uniquement — ex: le-petit-bistro"
              >
                <input name="slug" required pattern="[a-z0-9-]+" className={adminInputClass} />
              </FormField>

              <FormField label="Nombre de passages pour la récompense">
                <input
                  name="stampsRequired"
                  type="number"
                  min={1}
                  defaultValue={8}
                  required
                  className={adminInputClass}
                />
              </FormField>

              <FormField label="Texte de la récompense" hint='ex: "8e offert"'>
                <input name="rewardText" required className={adminInputClass} />
              </FormField>

              <hr className="border-white/10" />
              <p className="text-sm font-medium text-zinc-100">Connexion pour l&apos;entreprise</p>

              <FormField
                label="Identifiant de connexion"
                hint="ce que l'entreprise saisira pour se connecter — aucune adresse email requise"
              >
                <input name="loginIdentifier" type="text" required className={adminInputClass} />
              </FormField>

              <FormField label="Mot de passe">
                <input name="loginPassword" type="text" required minLength={8} className={adminInputClass} />
              </FormField>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400">Champs optionnels</h2>

              <FormField label="Catégorie">
                <select name="category" defaultValue="" className={adminInputClass}>
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
                hint="utilisée si aucune image de fond n'est ajoutée ci-dessous"
              >
                <ColorSwatchPicker name="backgroundColor" defaultValue="#27272a" />
              </FormField>

              <hr className="border-white/10" />
              <p className="text-sm font-medium text-zinc-100">Couleurs de l&apos;interface entreprise</p>
              <p className="-mt-2 text-xs text-zinc-500">
                Indépendantes de la couleur de la carte de fidélité ci-dessus — elles ne concernent que
                l&apos;interface que voit le personnel du restaurant.
              </p>

              <FormField label="Couleur du thème de l'interface" hint="boutons, navigation active, accents">
                <ColorSwatchPicker name="interfaceThemeColor" defaultValue="#059669" />
              </FormField>

              <FormField label="Couleur du texte de l'interface">
                <ColorSwatchPicker name="interfaceTextColor" defaultValue="#18181b" />
              </FormField>

              <FormField label="Couleur des cartes d'indicateurs">
                <ColorSwatchPicker name="interfaceCardColor" defaultValue="#ffffff" />
              </FormField>

              <FormField label="Offre de bienvenue (optionnel)">
                <input name="welcomeOfferText" className={adminInputClass} />
              </FormField>

              <FormField label="Adresse (optionnel)">
                <input name="address" className={adminInputClass} />
              </FormField>

              <FormField label="Logo (optionnel)">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                />
              </FormField>

              <FormField
                label="Image de fond de la carte (optionnel)"
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

          <SubmitButton pendingChildren="Création..." className={`${adminButtonClass} mt-6`}>
            Créer le restaurant
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
