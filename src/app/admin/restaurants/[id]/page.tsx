import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AdminNav } from "@/components/AdminNav";
import { FormField, formInputClass, primaryButtonClass } from "@/components/FormField";
import { ColorSwatchPicker } from "@/components/ColorSwatchPicker";
import { SubmitButton } from "@/components/SubmitButton";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { updateRestaurant, resetRestaurantPassword } from "../actions";
import { DeleteRestaurantButton } from "../DeleteRestaurantButton";

export default async function EditRestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; passwordReset?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const { error, saved, passwordReset } = await searchParams;

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
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AdminNav />

      <div className="w-full max-w-lg">
        <h1 className="mb-4 text-xl font-bold tracking-tight">{restaurant.name}</h1>

        {saved && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Profil bien modifié.
          </p>
        )}
        {passwordReset && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Mot de passe mis à jour.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code du lien public" width={160} height={160} />
          <a
            href={publicUrl}
            className="break-all text-center text-sm text-blue-600 underline dark:text-blue-400"
          >
            {publicUrl}
          </a>
        </div>

        <form action={updateRestaurant} className="space-y-4" encType="multipart/form-data">
          <input type="hidden" name="id" value={restaurant.id} />

          <FormField label="Nom de l'entreprise">
            <input name="name" defaultValue={restaurant.name} required className={formInputClass} />
          </FormField>

          <FormField label="Catégorie">
            <select name="category" defaultValue={restaurant.category ?? ""} className={formInputClass}>
              <option value="">Choisir une catégorie...</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Lien public (slug)">
            <input
              name="slug"
              defaultValue={restaurant.slug}
              required
              pattern="[a-z0-9-]+"
              className={formInputClass}
            />
          </FormField>

          <FormField
            label="Couleur du fond de la carte"
            hint="utilisée si aucune image de fond n'est active"
          >
            <ColorSwatchPicker name="backgroundColor" defaultValue={restaurant.background_color} />
          </FormField>

          <FormField label="Nombre de passages pour la récompense">
            <input
              name="stampsRequired"
              type="number"
              min={1}
              defaultValue={restaurant.stamps_required}
              required
              className={formInputClass}
            />
          </FormField>

          <FormField label="Texte de la récompense">
            <input name="rewardText" defaultValue={restaurant.reward_text} required className={formInputClass} />
          </FormField>

          <FormField label="Offre de bienvenue (optionnel)">
            <input
              name="welcomeOfferText"
              defaultValue={restaurant.welcome_offer_text ?? ""}
              className={formInputClass}
            />
          </FormField>

          <FormField label="Adresse (optionnel)">
            <input name="address" defaultValue={restaurant.address ?? ""} className={formInputClass} />
          </FormField>

          {restaurant.logo_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurant.logo_url}
                alt="Logo actuel"
                className="h-12 w-12 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
              />
              <span className="text-sm text-zinc-500">Logo actuel</span>
            </div>
          )}
          <FormField label="Remplacer le logo (optionnel)">
            <input
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={formInputClass}
            />
          </FormField>

          {restaurant.background_image_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurant.background_image_url}
                alt="Image de fond actuelle"
                className="h-12 w-20 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-500">
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
              className={formInputClass}
            />
          </FormField>

          <SubmitButton
            pendingChildren="Enregistrement..."
            className={primaryButtonClass}
          >
            Enregistrer
          </SubmitButton>
        </form>

        <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

        <h2 className="mb-3 text-sm font-semibold">Mot de passe du restaurant</h2>
        <form action={resetRestaurantPassword} className="flex gap-2">
          <input type="hidden" name="id" value={restaurant.id} />
          <input
            name="newPassword"
            type="text"
            placeholder="Nouveau mot de passe (6 caractères min.)"
            required
            minLength={6}
            className={formInputClass}
          />
          <SubmitButton
            pendingChildren="..."
            className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Réinitialiser
          </SubmitButton>
        </form>

        <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

        <h2 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
          Zone de danger
        </h2>
        <DeleteRestaurantButton id={restaurant.id} name={restaurant.name} />
      </div>
    </div>
  );
}
