import { loginRestaurant } from "./actions";

export default async function RestaurantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Espace restaurateur</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Connectez-vous pour scanner les cartes de vos clients.
        </p>
      </div>

      {error && (
        <p className="w-full max-w-sm rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form action={loginRestaurant} className="w-full max-w-sm space-y-4">
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
