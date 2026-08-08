import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      <h1 className="text-3xl font-semibold">Lamina Fidelity</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Cartes de fidélité numériques pour Apple Wallet et Google Wallet.
      </p>
      <Link
        href="/signup?r=demo"
        className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Voir la carte de démo
      </Link>
    </div>
  );
}
