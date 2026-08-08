"use client";

import { useTransition } from "react";
import { primaryButtonClass } from "@/components/FormField";
import { signupClient } from "./actions";

export function SignupForm({
  restaurantId,
  restaurantSlug,
}: {
  restaurantId: string;
  restaurantSlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => signupClient(formData))}
      className="w-full max-w-sm space-y-4"
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="restaurantSlug" value={restaurantSlug} />

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

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          Téléphone (optionnel)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

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
