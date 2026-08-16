"use client";

import { useTransition } from "react";
import { primaryButtonClass } from "@/components/FormField";
import { signupClient } from "./actions";

export function SignupForm({
  restaurantId,
  restaurantSlug,
  error,
  collectFirstName,
  collectLastName,
  collectPhone,
  collectEmail,
  collectCity,
  collectCivilite,
  collectDateNaissance,
  collectAdressePostale,
  collectProfession,
  collectNationalite,
  collectCodeParrainage,
}: {
  restaurantId: string;
  restaurantSlug: string;
  error?: string;
  collectFirstName: boolean;
  collectLastName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  collectCity: boolean;
  collectCivilite: boolean;
  collectDateNaissance: boolean;
  collectAdressePostale: boolean;
  collectProfession: boolean;
  collectNationalite: boolean;
  collectCodeParrainage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => signupClient(formData))}
      className="w-full max-w-sm space-y-4"
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="restaurantSlug" value={restaurantSlug} />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {collectFirstName && (
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
            Prénom
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectLastName && (
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium">
            Nom
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectEmail && (
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectPhone && (
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectCity && (
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium">
            Ville
          </label>
          <input
            id="city"
            name="city"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectCivilite && (
        <div>
          <label htmlFor="civilite" className="mb-1 block text-sm font-medium">
            Civilité
          </label>
          <select
            id="civilite"
            name="civilite"
            defaultValue=""
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Sélectionner...</option>
            <option value="Madame">Madame</option>
            <option value="Monsieur">Monsieur</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      )}

      {collectDateNaissance && (
        <div>
          <label htmlFor="dateNaissance" className="mb-1 block text-sm font-medium">
            Date de naissance
          </label>
          <input
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectAdressePostale && (
        <div>
          <label htmlFor="adressePostale" className="mb-1 block text-sm font-medium">
            Adresse postale
          </label>
          <textarea
            id="adressePostale"
            name="adressePostale"
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectProfession && (
        <div>
          <label htmlFor="profession" className="mb-1 block text-sm font-medium">
            Profession
          </label>
          <input
            id="profession"
            name="profession"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectNationalite && (
        <div>
          <label htmlFor="nationalite" className="mb-1 block text-sm font-medium">
            Nationalité
          </label>
          <input
            id="nationalite"
            name="nationalite"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectCodeParrainage && (
        <div>
          <label htmlFor="codeParrainage" className="mb-1 block text-sm font-medium">
            Code de parrainage
          </label>
          <input
            id="codeParrainage"
            name="codeParrainage"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {collectEmail && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="commercialEmailConsent"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span>J&apos;accepte de recevoir des emails commerciaux.</span>
        </label>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={primaryButtonClass}
      >
        {isPending ? "Création de votre carte..." : "Recevoir ma carte"}
      </button>
    </form>
  );
}
