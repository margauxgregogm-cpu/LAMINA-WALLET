import Link from "next/link";
import { logoutRestaurant } from "@/app/restaurant/login/actions";

export function RestaurantNav({
  restaurantName,
  active,
}: {
  restaurantName: string;
  active: "dashboard" | "scan";
}) {
  return (
    <div className="flex w-full max-w-2xl items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{restaurantName}</h1>
        <nav className="mt-1 flex gap-4 text-sm">
          <Link
            href="/restaurant"
            className={
              active === "dashboard"
                ? "font-medium underline"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }
          >
            Tableau de bord
          </Link>
          <Link
            href="/restaurant/scan"
            className={
              active === "scan"
                ? "font-medium underline"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }
          >
            Scanner
          </Link>
        </nav>
      </div>
      <form action={logoutRestaurant}>
        <button className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
          Déconnexion
        </button>
      </form>
    </div>
  );
}
