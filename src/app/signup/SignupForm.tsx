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
}: {
  restaurantId: string;
  restaurantSlug: string;
  error?: string;
  collectFirstName: boolean;
  collectLastName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  collectCity: boolean;
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
