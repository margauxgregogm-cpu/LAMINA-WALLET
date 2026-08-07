import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/AdminNav";
import { FormField, formInputClass } from "@/components/FormField";
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

      <div className="w-full max-w-lg">
        <h1 className="mb-4 text-xl font-semibold">Nouveau restaurant</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form action={createRestaurant} className="space-y-4" encType="multipart/form-data">
          <FormField label="Nom du restaurant">
            <input name="name" required className={formInputClass} />
          </FormField>

          <FormField
            label="Lien public (slug)"
            hint="lettres minuscules, chiffres et tirets uniquement — ex: le-petit-bistro"
          >
            <input name="slug" required pattern="[a-z0-9-]+" className={formInputClass} />
          </FormField>

          <FormField label="Thème de couleur">
            <select name="colorTheme" defaultValue="anthracite" className={formInputClass}>
              <option value="anthracite">Anthracite (noir)</option>
              <option value="white">Blanc</option>
              <option value="gray">Gris</option>
              <option value="navy">Bleu marine</option>
            </select>
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

          <hr className="border-zinc-200 dark:border-zinc-800" />
          <p className="text-sm font-medium">Connexion pour le restaurant</p>

          <FormField label="Email de connexion">
            <input name="loginEmail" type="email" required className={formInputClass} />
          </FormField>

          <FormField label="Mot de passe">
            <input name="loginPassword" type="text" required minLength={8} className={formInputClass} />
          </FormField>

          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Créer le restaurant
          </button>
        </form>
      </div>
    </div>
  );
}
