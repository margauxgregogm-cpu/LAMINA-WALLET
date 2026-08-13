"use client";

import { useActionState } from "react";
import { loginRestaurantAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { primaryButtonClass } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { HelpButton } from "@/components/HelpButton";
import { SplashScreen } from "@/components/restaurant/SplashScreen";

// isPending flips true the instant the form is submitted (before the
// Supabase round trip even starts) and stays true through the server
// action's redirect() into /restaurant/scan, so the splash covers the
// entire gap between clicking "Se connecter" and the entreprise interface
// being ready -- no intermediate blank state or "Connexion..." button.
export function RestaurantLoginForm({ error }: { error?: string }) {
  const [, formAction, isPending] = useActionState(loginRestaurantAction, undefined);

  if (isPending) {
    return <SplashScreen />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Espace entreprise</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Connectez-vous pour scanner les cartes de vos clients.
        </p>
      </div>

      {error && (
        <p className="w-full max-w-sm rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form action={formAction} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="identifier" className="mb-1 block text-sm font-medium">
            Identifiant
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[var(--theme-text,#18181b)] placeholder:text-[var(--theme-text,#18181b)]/40"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            variant="entreprise"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[var(--theme-text,#18181b)] placeholder:text-[var(--theme-text,#18181b)]/40"
          />
        </div>

        <SubmitButton pendingChildren="Connexion..." className={primaryButtonClass}>
          Se connecter
        </SubmitButton>
      </form>

      <HelpButton />
    </div>
  );
}
