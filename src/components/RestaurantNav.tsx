import Link from "next/link";
import { logoutRestaurant } from "@/app/restaurant/login/actions";
import { HelpButton } from "@/components/HelpButton";

export function RestaurantNav({
  restaurantName,
  logoUrl,
  active,
}: {
  restaurantName: string;
  logoUrl?: string | null;
  active: "dashboard" | "scan";
}) {
  return (
    <div className="flex w-full max-w-5xl items-center justify-between">
      <div className="flex items-center gap-3">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight">{restaurantName}</h1>
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
      </div>
      <div className="flex items-center gap-4">
        <HelpButton />
        <form action={logoutRestaurant}>
          <button className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}
