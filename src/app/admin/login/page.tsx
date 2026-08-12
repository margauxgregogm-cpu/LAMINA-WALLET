import { loginAdmin } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { primaryButtonClass } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gérez les restaurants et leurs cartes de fidélité.
        </p>
      </div>

      {error && (
        <p className="w-full max-w-sm rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form action={loginAdmin} className="w-full max-w-sm space-y-4">
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <SubmitButton
          pendingChildren="Connexion..."
          className={primaryButtonClass}
        >
          Se connecter
        </SubmitButton>
      </form>
    </div>
  );
}
