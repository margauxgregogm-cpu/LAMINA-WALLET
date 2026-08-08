import Link from "next/link";
import { logoutAdmin } from "@/app/admin/login/actions";

export function AdminNav() {
  return (
    <div className="flex w-full max-w-2xl items-center justify-between">
      <Link href="/admin" className="text-xl font-bold tracking-tight">
        Administration
      </Link>
      <form action={logoutAdmin}>
        <button className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
          Déconnexion
        </button>
      </form>
    </div>
  );
}
