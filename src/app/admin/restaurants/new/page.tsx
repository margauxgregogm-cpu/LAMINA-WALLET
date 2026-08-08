import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/AdminNav";
import { FormField, formInputClass, primaryButtonClass } from "@/components/FormField";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { SubmitButton } from "@/components/SubmitButton";
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
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AdminNav />

      <div className="w-full max-w-3xl">
        <h1 className="mb-4 text-xl font-bold tracking-tight">Nouvelle entreprise</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form action={createRestaurant} encType="multipart/form-data">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-500">Champs obligatoires</h2>

              <FormField label="Nom de l'entreprise">
                <input name="name" required className={formInputClass} />
              </FormField>

              <FormField
                label="Lien public (slug)"
                hint="lettres minuscules, chiffres et tirets uniquement — ex: le-petit-bistro"
              >
                <input name="slug" required pattern="[a-z0-9-]+" className={formInputClass} />
              </FormField>

              <FormField label="Nombre de passages pour la récompense">
                <input
                  name="stampsRequired"
                  type="number"
                  min={1}
                  defaultValue={8}
                  required
                  className={formInputClass}
                />
              </FormField>

              <FormField label="Texte de la récompense" hint='ex: "8e offert"'>
                <input name="rewardText" required className={formInputClass} />
              </FormField>

              <hr className="border-zinc-200 dark:border-zinc-800" />
              <p className="text-sm font-medium">Connexion pour l&apos;entreprise</p>

              <FormField label="Email de connexion">
                <input name="loginEmail" type="email" required className={formInputClass} />
              </FormField>

              <FormField label="Mot de passe">
                <input
                  name="loginPassword"
                  type="text"
                  required
                  minLength={8}
                  className={formInputClass}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-500">Champs optionnels</h2>

              <FormField label="Catégorie">
                <select name="category" defaultValue="" className={formInputClass}>
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

              <FormField label="Offre de bienvenue (optionnel)">
                <input name="welcomeOfferText" className={formInputClass} />
              </FormField>

              <FormField label="Adresse (optionnel)">
                <input name="address" className={formInputClass} />
              </FormField>

              <FormField label="Logo (optionnel)">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={formInputClass}
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
                  className={formInputClass}
                />
              </FormField>
            </div>
          </div>

          <SubmitButton pendingChildren="Création..." className={`${primaryButtonClass} mt-6`}>
            Créer le restaurant
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
