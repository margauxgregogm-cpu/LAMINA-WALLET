import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { RestaurantNav } from "@/components/RestaurantNav";
import { ScanClient } from "./ScanClient";

export default async function ScanPage() {
  const restaurant = await getAuthenticatedRestaurant();

  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <RestaurantNav restaurantName={restaurant.name} logoUrl={restaurant.logo_url} active="scan" />
      <ScanClient
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        colorTheme={restaurant.color_theme}
      />
    </div>
  );
}
